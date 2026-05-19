import { useRef } from 'react';

function CampoControlado() {

  // useRef crea un objeto { current: null }
  // cuando React cree el <input>, llenará .current con ese elemento
  const inputRef = useRef(null);

  function enfocar() {
    // .focus() es un método nativo del DOM
    // es como hacer document.getElementById('x').focus()
    inputRef.current.focus();
  }

  function limpiar() {
    // borramos el valor directamente en el DOM
    inputRef.current.value = '';
    // y enfocamos para que el usuario pueda seguir escribiendo
    inputRef.current.focus();
  }

  function leer() {
    // leemos el valor actual del input
    const texto = inputRef.current.value;
    console.log('Texto en el input:', texto);
    alert('Escribiste: ' + texto);
  }

  return (
    <div style={{ padding: 24 }}>

      <h2>Ejercicio useRef</h2>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>

        {"/* ref={inputRef} conecta este elemento con la variable */"}
        <input
          ref={inputRef}
          placeholder="Escribe algo aquí..."
          style={{ padding: 8, fontSize: 14, flex: 1 }}
        />

        <button onClick={enfocar}>Enfocar</button>
        <button onClick={limpiar}>Limpiar</button>
        <button onClick={leer}>Leer</button>
        <Link to="/">Ver productos</Link>
      </div>
    </div>
  );
}

export default CampoControlado;