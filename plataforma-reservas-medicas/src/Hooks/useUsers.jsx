// useUsers.js
//
// CAPA DE LÓGICA — Custom Hook
// Responsabilidad: estado del formulario, validaciones client-side,
// orquestación de la llamada a usersApi y feedback al componente.
//
// Exporta:
//   useUsers() → { form, passwordStrength, showPassword,
//                  saving, error, lastCreated,
//                  handleChange, handleRoleSelect,
//                  toggleShowPassword, handleSubmit, dismissSuccess }

import { useState } from 'react';
import { registerUser } from '../api/usersApi';

// ─── Validación de contraseña ──────────────────────────────────────────────
// Devuelve null si el campo está vacío, o un objeto { level, label }.
function evaluatePassword(password) {
  if (!password) return null;
  if (password.length < 8)
    return { level: 'weak', label: 'Muy corta (mínimo 8 caracteres)' };
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
    return { level: 'fair', label: 'Agrega letras y números' };
  if (password.length >= 12)
    return { level: 'strong', label: 'Contraseña fuerte' };
  return { level: 'ok', label: 'Contraseña aceptable' };
}

// ─── Estado inicial del formulario ────────────────────────────────────────
const INITIAL_FORM = { documentNumber: '', password: '', role: '' };

// ─── Interpretación de errores del backend ────────────────────────────────
function parseApiError(err) {
  if (err.response?.status === 409)
    return 'Ya existe un usuario con ese número de documento.';
  return (
    err.response?.data?.message ??
    err.message ??
    'Error al crear el usuario. Intenta de nuevo.'
  );
}

// ─────────────────────────────────────────────────────────────────────────
export function useUsers() {
  const [form, setForm]               = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);
  const [lastCreated, setLastCreated] = useState(null); // { documentNumber, role }

  // Derivado — no necesita estado propio
  const passwordStrength = evaluatePassword(form.password);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleRoleSelect = (roleValue) => {
    setForm(prev => ({ ...prev, role: roleValue }));
    if (error) setError(null);
  };

  const toggleShowPassword = () => setShowPassword(v => !v);

  const dismissSuccess = () => setLastCreated(null);

  // ── Submit con validaciones client-side ───────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones en orden de importancia
    if (!form.documentNumber.trim())
      return setError('El número de documento es requerido.');
    if (form.documentNumber.trim().length < 6)
      return setError('El número de documento debe tener al menos 6 caracteres.');
    if (!form.password)
      return setError('La contraseña es requerida.');
    if (form.password.length < 8)
      return setError('La contraseña debe tener al menos 8 caracteres.');
    if (!form.role)
      return setError('Debes seleccionar un rol para el usuario.');

    setSaving(true);
    setError(null);

    try {
      await registerUser({
        documentNumber: form.documentNumber.trim(),
        password:       form.password,
        roles:          [form.role], // El backend espera un array de strings
      });

      setLastCreated({ documentNumber: form.documentNumber.trim(), role: form.role });
      setForm(INITIAL_FORM); // Limpiar para el siguiente usuario

    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return {
    // Estado
    form,
    passwordStrength,
    showPassword,
    saving,
    error,
    lastCreated,
    // Acciones
    handleChange,
    handleRoleSelect,
    toggleShowPassword,
    handleSubmit,
    dismissSuccess,
  };
}