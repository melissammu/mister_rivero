import { useParams } from "react-router-dom";

import "../../styles/ProductoDetalle.css";

export default function ProductoDetalle() {
  const { tipo, id } = useParams();

  return (
    <main className="producto-detalle-page">
      <h1>Detalle del producto</h1>

      <p>
        Tipo: <strong>{tipo}</strong>
      </p>

      <p>
        Identificador: <strong>{id}</strong>
      </p>
    </main>
  );
}