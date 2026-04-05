
export interface Manual {
  id: string;
  title: string;
  content: string;
  category: 'servicio' | 'cocina' | 'seguridad' | 'limpieza';
}

export const MANUALS: Manual[] = [
  {
    id: 'protocolo-bienvenida',
    title: 'Protocolo de Bienvenida Imperial',
    category: 'servicio',
    content: `
      1. Saludo: "¡Ni Hao! Bienvenidos al Chifa Brillo El Sol. Es un honor recibirles."
      2. Acompañamiento: Guiar a los comensales a la mesa asignada manteniendo una postura erguida.
      3. Entrega de Carta: Entregar la carta abierta por la primera página (Sugerencias del Chef).
      4. Bebidas: Ofrecer té de cortesía o sugerir bebidas especiales de inmediato.
    `
  },
  {
    id: 'manejo-alergias',
    title: 'Manejo de Alergias y Restricciones',
    category: 'servicio',
    content: `
      1. Pregunta Proactiva: Siempre preguntar "¿Alguna persona en la mesa tiene alergias alimentarias?".
      2. Alérgenos Comunes: 
         - Maní: Presente en Salsas Satay y algunos Saltados.
         - Mariscos: Presente en Kam Lu Wantán y Arroz Chaufa Especial.
         - Gluten: Presente en la mayoría de salsas de soya (Sillao).
      3. Comunicación: Informar inmediatamente al Chef de Wok sobre cualquier alergia.
      4. Verificación: El mesero debe verificar doblemente el plato antes de servirlo.
    `
  },
  {
    id: 'limpieza-mesas',
    title: 'Estándares de Limpieza de Mesas',
    category: 'limpieza',
    content: `
      1. Despeje: Retirar platos vacíos por el lado derecho del comensal.
      2. Limpieza: Usar paño de microfibra con solución sanitizante grado alimenticio.
      3. Montaje: Reponer palillos (Ohashi) y servilletas imperiales de inmediato.
      4. Piso: Verificar que el área bajo la mesa esté impecable.
    `
  },
  {
    id: 'seguridad-wok',
    title: 'Seguridad en el Área de Wok',
    category: 'cocina',
    content: `
      1. Encendido: Verificar válvulas de gas antes de encender el quemador de alta presión.
      2. Manejo de Aceite: Nunca verter agua sobre aceite caliente.
      3. Vestimenta: Uso obligatorio de filipina ignífuga y mandil de cuero.
      4. Extintores: Conocer la ubicación del extintor Clase K para fuegos de cocina.
    `
  }
];
