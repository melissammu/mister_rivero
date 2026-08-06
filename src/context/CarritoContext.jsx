import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const CarritoContext = createContext(null);

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function obtenerNombreProducto(producto = {}) {
  const marca = producto.marca || "";
  const modelo = producto.modelo || "";

  return (
    producto.nombre ||
    producto.titulo ||
    `${marca} ${modelo}`.trim() ||
    producto.descripcion ||
    "Producto"
  );
}

function obtenerPrecioProducto(producto = {}) {
  const precio =
    producto.precioVenta ??
    producto.precio_venta ??
    producto.precio ??
    0;

  return Number(precio) || 0;
}

function obtenerReferenciaProducto(producto = {}) {
  const referencia =
    producto.id ||
    producto.codigo ||
    producto.productoId ||
    producto.producto_id;

  if (referencia) {
    return String(referencia);
  }

  return crypto.randomUUID();
}

/* =========================================================
   PROVIDER
========================================================= */

export function CarritoProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [pedidoCarrito, setPedidoCarrito] = useState(null);
  const [items, setItems] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [errorCarrito, setErrorCarrito] = useState("");

  /* =======================================================
     CARGAR CARRITO DEL USUARIO
  ======================================================= */

  const cargarCarrito = useCallback(async (usuarioActual) => {
    if (!usuarioActual?.id) {
      setPedidoCarrito(null);
      setItems([]);
      setCargando(false);
      setErrorCarrito("");
      return;
    }

    setCargando(true);
    setErrorCarrito("");

    try {
      const { data: pedido, error: errorPedido } = await supabase
        .from("pedidos")
        .select("*")
        .eq("cliente_id", usuarioActual.id)
        .in("estado", [
          "carrito",
          "pago_pendiente",
          "expirado",
        ])
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (errorPedido) {
        throw errorPedido;
      }

      if (!pedido) {
        setPedidoCarrito(null);
        setItems([]);
        return;
      }

      const { data: productos, error: errorItems } =
        await supabase
          .from("pedido_items")
          .select("*")
          .eq("pedido_id", pedido.id)
          .order("created_at", {
            ascending: true,
          });

      if (errorItems) {
        throw errorItems;
      }

      setPedidoCarrito(pedido);
      setItems(productos || []);
    } catch (error) {
      console.error(
        "Error cargando el carrito:",
        error
      );

      setErrorCarrito(
        error.message ||
          "No fue posible cargar el carrito."
      );

      setPedidoCarrito(null);
      setItems([]);
    } finally {
      setCargando(false);
    }
  }, []);

  /* =======================================================
     DETECTAR SESIÓN DE SUPABASE
  ======================================================= */

  useEffect(() => {
    let componenteActivo = true;

    async function iniciarCarrito() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!componenteActivo) {
          return;
        }

        const usuarioActual =
          session?.user || null;

        setUsuario(usuarioActual);

        await cargarCarrito(usuarioActual);
      } catch (error) {
        console.error(
          "Error obteniendo la sesión:",
          error
        );

        if (componenteActivo) {
          setUsuario(null);
          setPedidoCarrito(null);
          setItems([]);
          setCargando(false);
        }
      }
    }

    iniciarCarrito();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_evento, session) => {
        const usuarioActual =
          session?.user || null;

        setUsuario(usuarioActual);

        window.setTimeout(() => {
          cargarCarrito(usuarioActual);
        }, 0);
      }
    );

    return () => {
      componenteActivo = false;
      subscription.unsubscribe();
    };
  }, [cargarCarrito]);

  /* =======================================================
     CREAR O RECUPERAR PEDIDO EN ESTADO CARRITO
  ======================================================= */

  async function obtenerOCrearPedido() {
    if (!usuario?.id) {
      throw new Error(
        "USUARIO_NO_AUTENTICADO"
      );
    }

    if (
      pedidoCarrito?.id &&
      pedidoCarrito.estado === "carrito"
    ) {
      return pedidoCarrito;
    }

    const { data: pedidoExistente, error: errorBuscar } =
      await supabase
        .from("pedidos")
        .select("*")
        .eq("cliente_id", usuario.id)
        .eq("estado", "carrito")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (errorBuscar) {
      throw errorBuscar;
    }

    if (pedidoExistente) {
      setPedidoCarrito(pedidoExistente);
      return pedidoExistente;
    }

    const { data: nuevoPedido, error } =
      await supabase
        .from("pedidos")
        .insert({
          cliente_id: usuario.id,
          estado: "carrito",
          subtotal: 0,
          envio: 0,
          impuestos: 0,
          total: 0,
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    setPedidoCarrito(nuevoPedido);
    setItems([]);

    return nuevoPedido;
  }

  /* =======================================================
     RECALCULAR SUBTOTAL Y TOTAL
  ======================================================= */

  async function recalcularPedido(pedidoId) {
    const { data: productos, error } =
      await supabase
        .from("pedido_items")
        .select("*")
        .eq("pedido_id", pedidoId)
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    const nuevosItems = productos || [];

    const subtotalCalculado =
      nuevosItems.reduce(
        (acumulado, item) =>
          acumulado +
          Number(item.subtotal || 0),
        0
      );

    const envioActual = Number(
      pedidoCarrito?.envio || 0
    );

    const impuestosActuales = Number(
      pedidoCarrito?.impuestos || 0
    );

    const totalCalculado =
      subtotalCalculado +
      envioActual +
      impuestosActuales;

    const {
      data: pedidoActualizado,
      error: errorActualizar,
    } = await supabase
      .from("pedidos")
      .update({
        subtotal: subtotalCalculado,
        total: totalCalculado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pedidoId)
      .select()
      .single();

    if (errorActualizar) {
      throw errorActualizar;
    }

    setItems(nuevosItems);
    setPedidoCarrito(pedidoActualizado);

    return pedidoActualizado;
  }

  /* =======================================================
     AGREGAR PRODUCTO AL CARRITO
  ======================================================= */

  async function agregarAlCarrito(
    producto,
    tipoProducto,
    cantidadSolicitada = 1
  ) {
    if (!usuario?.id) {
      localStorage.setItem(
        "rutaDespuesDelLogin",
        window.location.pathname
      );

      throw new Error(
        "USUARIO_NO_AUTENTICADO"
      );
    }

    if (tipoProducto === "amazon") {
      throw new Error("PRODUCTO_AMAZON");
    }

    if (
      !["motor", "autoparte"].includes(
        tipoProducto
      )
    ) {
      throw new Error(
        "TIPO_PRODUCTO_INVALIDO"
      );
    }

    if (
      pedidoCarrito?.estado ===
      "pago_pendiente"
    ) {
      throw new Error(
        "RESERVA_ACTIVA"
      );
    }

    setProcesando(true);
    setErrorCarrito("");

    try {
      const pedido =
        await obtenerOCrearPedido();

      const referencia =
        obtenerReferenciaProducto(producto);

      const nombre =
        obtenerNombreProducto(producto);

      const precioUnitario =
        obtenerPrecioProducto(producto);

      if (precioUnitario < 0) {
        throw new Error(
          "PRECIO_PRODUCTO_INVALIDO"
        );
      }

      const cantidad =
        tipoProducto === "motor"
          ? 1
          : Math.max(
              1,
              Number(cantidadSolicitada) || 1
            );

      const { data: itemExistente, error: errorBuscarItem } =
        await supabase
          .from("pedido_items")
          .select("*")
          .eq("pedido_id", pedido.id)
          .eq("producto_id", referencia)
          .eq("tipo_producto", tipoProducto)
          .maybeSingle();

      if (errorBuscarItem) {
        throw errorBuscarItem;
      }

      if (itemExistente) {
        if (tipoProducto === "motor") {
          throw new Error(
            "MOTOR_YA_AGREGADO"
          );
        }

        const nuevaCantidad =
          Number(itemExistente.cantidad) +
          cantidad;

        const { error: errorActualizarItem } =
          await supabase
            .from("pedido_items")
            .update({
              cantidad: nuevaCantidad,
              subtotal:
                nuevaCantidad *
                precioUnitario,
              estado: "en_carrito",
            })
            .eq("id", itemExistente.id);

        if (errorActualizarItem) {
          throw errorActualizarItem;
        }
      } else {
        const { error: errorInsertarItem } =
          await supabase
            .from("pedido_items")
            .insert({
              pedido_id: pedido.id,
              producto_id: referencia,
              tipo_producto: tipoProducto,
              nombre_producto: nombre,
              cantidad,
              precio_unitario:
                precioUnitario,
              subtotal:
                precioUnitario * cantidad,
              estado: "en_carrito",
            });

        if (errorInsertarItem) {
          throw errorInsertarItem;
        }
      }

      await recalcularPedido(pedido.id);

      return {
        correcto: true,
        mensaje:
          "Producto agregado al carrito.",
      };
    } catch (error) {
      console.error(
        "Error agregando al carrito:",
        error
      );

      setErrorCarrito(
        error.message ||
          "No fue posible agregar el producto."
      );

      throw error;
    } finally {
      setProcesando(false);
    }
  }

  /* =======================================================
     CAMBIAR CANTIDAD
  ======================================================= */

  async function cambiarCantidad(
    itemId,
    nuevaCantidad
  ) {
    if (!pedidoCarrito?.id) {
      throw new Error("CARRITO_NO_EXISTE");
    }

    if (
      pedidoCarrito.estado !== "carrito"
    ) {
      throw new Error(
        "CARRITO_NO_MODIFICABLE"
      );
    }

    const item = items.find(
      (producto) => producto.id === itemId
    );

    if (!item) {
      throw new Error(
        "PRODUCTO_NO_ENCONTRADO"
      );
    }

    if (item.tipo_producto === "motor") {
      throw new Error(
        "MOTOR_CANTIDAD_UNICA"
      );
    }

    const cantidad = Math.max(
      1,
      Number(nuevaCantidad) || 1
    );

    setProcesando(true);
    setErrorCarrito("");

    try {
      const { error } = await supabase
        .from("pedido_items")
        .update({
          cantidad,
          subtotal:
            cantidad *
            Number(item.precio_unitario),
        })
        .eq("id", itemId)
        .eq(
          "pedido_id",
          pedidoCarrito.id
        );

      if (error) {
        throw error;
      }

      await recalcularPedido(
        pedidoCarrito.id
      );
    } catch (error) {
      console.error(
        "Error cambiando cantidad:",
        error
      );

      setErrorCarrito(
        error.message ||
          "No fue posible cambiar la cantidad."
      );

      throw error;
    } finally {
      setProcesando(false);
    }
  }

  /* =======================================================
     ELIMINAR PRODUCTO
  ======================================================= */

 async function eliminarDelCarrito(itemId) {
  if (!pedidoCarrito?.id) {
    throw new Error("CARRITO_NO_EXISTE");
  }

  setProcesando(true);
  setErrorCarrito("");

  try {
    const pedidoReservado =
      pedidoCarrito.estado === "pago_pendiente";

    if (pedidoReservado) {
      const { error } = await supabase.rpc(
        "cancelar_item_reservado",
        {
          p_item_id: itemId,
        }
      );

      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("pedido_items")
        .delete()
        .eq("id", itemId)
        .eq("pedido_id", pedidoCarrito.id);

      if (error) {
        throw error;
      }

      await recalcularPedido(
        pedidoCarrito.id
      );
    }

    await cargarCarrito(usuario);
  } catch (error) {
    console.error(
      "Error eliminando producto:",
      error
    );

    setErrorCarrito(
      error.message ||
        "No fue posible eliminar el producto."
    );

    throw error;
  } finally {
    setProcesando(false);
  }
}

  /* =======================================================
     INICIAR RESERVA DE 10 MINUTOS
  ======================================================= */

  async function iniciarReserva() {
    if (!usuario?.id) {
      localStorage.setItem(
        "rutaDespuesDelLogin",
        "/carrito"
      );

      throw new Error(
        "USUARIO_NO_AUTENTICADO"
      );
    }

    if (!pedidoCarrito?.id) {
      throw new Error("CARRITO_VACIO");
    }

    if (items.length === 0) {
      throw new Error("CARRITO_VACIO");
    }

    if (
      pedidoCarrito.estado ===
        "pago_pendiente" &&
      pedidoCarrito.reservado_hasta
    ) {
      return {
        pedido_id: pedidoCarrito.id,
        estado: pedidoCarrito.estado,
        reservado_hasta:
          pedidoCarrito.reservado_hasta,
      };
    }

    setProcesando(true);
    setErrorCarrito("");

    try {
      const { data, error } =
        await supabase.rpc(
          "iniciar_reserva",
          {
            p_pedido_id:
              pedidoCarrito.id,
          }
        );

      if (error) {
        throw error;
      }

      await cargarCarrito(usuario);

      return Array.isArray(data)
        ? data[0]
        : data;
    } catch (error) {
      console.error(
        "Error iniciando reserva:",
        error
      );

      setErrorCarrito(
        error.message ||
          "No fue posible iniciar la reserva."
      );

      throw error;
    } finally {
      setProcesando(false);
    }
  }

  /* =======================================================
     VACIAR MENSAJE DE ERROR
  ======================================================= */

  function limpiarErrorCarrito() {
    setErrorCarrito("");
  }

  /* =======================================================
     VALORES CALCULADOS
  ======================================================= */

  const cantidadProductos = useMemo(
    () =>
      items.reduce(
        (totalAcumulado, item) =>
          totalAcumulado +
          Number(item.cantidad || 0),
        0
      ),
    [items]
  );

  const subtotal = Number(
    pedidoCarrito?.subtotal || 0
  );

  const envio = Number(
    pedidoCarrito?.envio || 0
  );

  const impuestos = Number(
    pedidoCarrito?.impuestos || 0
  );

  const total = Number(
    pedidoCarrito?.total || 0
  );

  const reservaActiva =
    pedidoCarrito?.estado ===
      "pago_pendiente" &&
    Boolean(
      pedidoCarrito?.reservado_hasta
    );

  /* =======================================================
     VALOR DEL CONTEXTO
  ======================================================= */

  const valor = {
    usuario,
    pedidoCarrito,
    items,

    cargando,
    procesando,
    errorCarrito,

    cantidadProductos,
    subtotal,
    envio,
    impuestos,
    total,
    reservaActiva,

    agregarAlCarrito,
    cambiarCantidad,
    eliminarDelCarrito,
    iniciarReserva,
    limpiarErrorCarrito,

    recargarCarrito: () =>
      cargarCarrito(usuario),
  };

  return (
    <CarritoContext.Provider value={valor}>
      {children}
    </CarritoContext.Provider>
  );
}

/* =========================================================
   HOOK useCarrito
========================================================= */

export function useCarrito() {
  const contexto = useContext(
    CarritoContext
  );

  if (!contexto) {
    throw new Error(
      "useCarrito debe utilizarse dentro de CarritoProvider."
    );
  }

  return contexto;
}