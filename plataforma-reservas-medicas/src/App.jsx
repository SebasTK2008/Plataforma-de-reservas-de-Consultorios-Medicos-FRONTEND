import Contador from './components/Contador';
import ListaUsuarios from './components/ListaUsuarios';
import { Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Contador />} />
        <Route path="/lista" element={<ListaUsuarios />} />
      </Routes>
    </>
  );
}

export default App;