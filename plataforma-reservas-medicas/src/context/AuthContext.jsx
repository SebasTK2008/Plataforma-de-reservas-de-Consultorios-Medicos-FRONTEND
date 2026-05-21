// AuthContext.jsx
// Este archivo hace tres cosas:
//   1. Crea el "contenedor" de información global (Context)
//   2. Crea el "proveedor" que envuelve la app (Provider)
//   3. Exporta ambos para que otros archivos los usen

import { createContext, useState, useEffect } from 'react';

// createContext() crea la "caja" vacía de información global
// El null es el valor por defecto si alguien accede sin el Provider
export const AuthContext = createContext(null);

// AuthProvider es el componente que envuelve TODA la app
// Todo componente dentro de él puede acceder al contexto
export function AuthProvider({ children }) {

  // ─────────────────────────────────────────
  // ESTADO — La información que guardamos
  // ─────────────────────────────────────────

  // El token JWT que devuelve el backend al hacer login
  // Intentamos leerlo de localStorage al iniciar
  // (por si el usuario ya había iniciado sesión antes)
  const [token, setToken] = useState(
    () => localStorage.getItem('umars_token') || null
  );

  // La información del usuario decodificada del token
  // Ejemplo: { sub: "12345678", roles: ["ROLE_ADMIN"] }
  const [user, setUser] = useState(
    () => decodeToken(localStorage.getItem('umars_token'))
  );

  // Bandera simple: ¿hay alguien logueado?
  const isAuthenticated = token !== null;

  // ─────────────────────────────────────────
  // EFECTO — Sincronizar token con localStorage
  // ─────────────────────────────────────────

  // useEffect se ejecuta cada vez que "token" cambia
  // Si hay token → lo guarda en localStorage
  // Si no hay token → lo borra de localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('umars_token', token);
    } else {
      localStorage.removeItem('umars_token');
    }
  }, [token]); // ← El [] con token significa "ejecutar cuando token cambie"

  // ─────────────────────────────────────────
  // FUNCIONES — Las acciones disponibles
  // ─────────────────────────────────────────

  // login() → se llama después de que el backend responde exitosamente
  // Recibe el token JWT como string
  function login(newToken) {
    setToken(newToken);
    setUser(decodeToken(newToken));
  }

  // logout() → borra toda la información de sesión
  function logout() {
    setToken(null);
    setUser(null);
  }

  // ─────────────────────────────────────────
  // VALOR — Lo que compartimos con todos los componentes
  // ─────────────────────────────────────────

  // Todo lo que está en "value" puede ser leído
  // por cualquier componente hijo
  const value = {
    token,
    user,
    isAuthenticated,
    login,
    logout
  };

  return (
    // AuthContext.Provider "envuelve" a los hijos
    // y les comparte el "value"
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────
// FUNCIÓN AUXILIAR — Decodificar el JWT
// ─────────────────────────────────────────

// Un JWT tiene 3 partes separadas por puntos:
// eyJhbGciOiJIUzI1NiJ9  ← Header  (algoritmo)
// eyJzdWIiOiIxMjM0NTY3ODkwIn0  ← Payload (datos del usuario)
// SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Firma
//
// Nosotros solo necesitamos el Payload (parte del medio)
function decodeToken(token) {
  if (!token) return null;

  try {
    // Tomamos la segunda parte (índice 1) separando por "."
    const payload = token.split('.')[1];

    // atob() decodifica Base64 a texto
    // El payload del JWT está en Base64
    const decoded = atob(payload);

    // Convertimos el texto JSON a un objeto JavaScript
    return JSON.parse(decoded);

  } catch (error) {
    // Si el token está malformado, retornamos null
    console.error('Error decodificando token:', error);
    return null;
  }
}