// useAuth.js — Hook personalizado para acceder al AuthContext
// En lugar de importar useContext y AuthContext en cada componente,
// solo importas useAuth y listo.

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {

  // useContext() lee el valor del Provider más cercano
  const context = useContext(AuthContext);

  // Si alguien usa useAuth() fuera del AuthProvider,
  // lanzamos un error claro en lugar de fallar misteriosamente
  if (context === null) {
    throw new Error(
      'useAuth() debe usarse dentro de un <AuthProvider>. ' +
      'Verifica que AuthProvider envuelva tu App en main.jsx'
    );
  }

  return context;
}