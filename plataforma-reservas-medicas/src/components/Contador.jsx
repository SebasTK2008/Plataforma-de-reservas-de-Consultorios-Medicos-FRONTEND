import { useState } from 'react';

function Contador() {
    const [contador, setContador] = useState(0);

    const incrementar = () => {
        setContador(contador + 1);
    };
    return (
        <div>
            <h1>Cantidad de productos: {contador}</h1>
            <button onClick={incrementar}>Incrementar</button>
            <button onClick={() => setContador(contador - 1)}>Decrementar</button>
            <Link to="/lista">Ver listaUsuarios</Link>
        </div>
    );
}

export default Contador;
