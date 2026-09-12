export const releases = [
  {
    version: "1.6.0",
    date: "11 de Septiembre, 2026",
    tagline: "Rediseño Total 'El Mostrador Moderno' & Sistema de Diseño Bodega",
    highlights: [
      "Rediseño visual integral de toda la plataforma inspirado en mostradores de abarrotes modernos y libros contables (bodega ledger).",
      "Tipografía artesanal Plus Jakarta Sans y JetBrains Mono con alineación numérica tabular (font-tabular) en finanzas, precios y stocks.",
      "Paleta cromática intencional: pergamino cálido y pizarra nocturna con acentos en ámbar mostrador (#D97706), jade esmeralda (#059669) y carmesí (#DC2626).",
      "Directorio de clientes y libreta de cuentas unificados: desglose contable integral, balance neto instantáneo y filtros rápidos de saldo.",
      "Terminal de cobro POS optimizada: visualización de tickets clara, selectores numéricos ágiles y totalizador de caja prominente.",
      "Catálogo de inventario con ribbon métrico contable y etiquetas de existencias (Normal, Stock Bajo ≤5, Agotado).",
      "Recepción y remisión de compras a proveedores con registro detallado y desglose de costes.",
      "Vista móvil para clientes (Estado de Cuenta) con botón de copiado CLABE en 1 toque y desglose de tickets en modal táctil.",
    ],
    sections: [
      {
        title: "🎨 Sistema Visual & Tipografía",
        items: [
          "Eliminación de tarjetas genéricas SaaS, bordes hiper-redondeados y sombras difusas.",
          "Superficies de alto contraste con bordes nítidos (#E5E2DA claro / #282C32 oscuro).",
          "Alineación tabular estricta de precios, totales y saldos para facilitar la lectura contable rápida.",
        ],
      },
      {
        title: "⚡ Experiencia en Mostrador",
        items: [
          "Buscador de clientes por nombre y teléfono con botones de acción rápida (Fiar, Abonar, Desglose).",
          "Calculadora y totalizador de caja en tiempo real con selector de métodos de pago.",
          "Flujo de abonos y compras a crédito con alerta visual de rebase de límite de crédito.",
        ],
      },
      {
        title: "📱 Móvil & PWA",
        items: [
          "Modal de ticket de compra itemizado en el enlace público de clientes.",
          "Banner de instalación PWA rediseñado para Android e iOS.",
          "Navegación de barra superior con drawer optimizado para pantallas pequeñas.",
        ],
      },
    ],
  },
  {
    version: "1.5.1",
    date: "11 de Septiembre, 2026",
    tagline: "Baja Lógica de Productos y Orden Alfabético en Ventas",
    highlights: [
      "Baja lógica de productos en inventario: al eliminar un dulce se oculta de los catálogos y listas pero se conserva su historial completo de transacciones y ventas.",
      "Listado alfabético estricto (A-Z) de productos en la selección de compras/ventas a clientes y en el punto de venta.",
      "Migración automática de esquema con columna is_active en la base de datos PostgreSQL.",
    ],
    sections: [
      {
        title: "📦 Inventario y Catálogo",
        items: [
          "Eliminación lógica (soft delete) mediante UPDATE is_active = false para proteger la integridad referencial.",
          "Filtrado automático de productos activos en precios públicos, inventario y buscador de dulces.",
        ],
      },
      {
        title: "🛒 Experiencia en Punto de Venta",
        items: [
          "Ordenamiento alfabético (A-Z) en el componente SweetCombobox para selección rápida al vender a clientes.",
          "Mensajes descriptivos al dar de baja un artículo del inventario.",
        ],
      },
      {
        title: "⚙️ Base de Datos",
        items: [
          "Migración automática de tabla sweets con columna is_active BOOLEAN DEFAULT true.",
        ],
      },
    ],
  },
  {
    version: "1.5.0",
    date: "11 de Septiembre, 2026",
    tagline: "Historial de Versiones, Clientes por Defecto y Panel Unificado",
    highlights: [
      "Página de inicio configurada por defecto en /clientes para agilizar la gestión diaria de cobros, fiados y abonos.",
      "Nueva vista de Historial de Versiones (/releases) accesible directamente al pulsar la versión en el Navbar.",
      "Pestaña unificada de Configuración protegida por contraseña para proteger parámetros del negocio, WhatsApp, programa de puntos y seguridad.",
      "Soporte de múltiples métodos de pago (Efectivo, Tarjeta, Transferencia, Crédito) en el punto de venta y compras.",
      "Límite de crédito asignable y configurable por cliente con alertas de saldo.",
      "Formato limpio de fechas cortas (D/MM/YYYY) en las gráficas y analíticas de ventas.",
      "Depuración del directorio de clientes retirando botones redundantes para optimizar la interfaz.",
    ],
    sections: [
      {
        title: "✨ Nuevas Funcionalidades",
        items: [
          "Módulo visual de releases con registro cronológico de cambios y botón de regreso rápido.",
          "Ruta principal redireccionada a /clientes para agilizar la experiencia de usuario diaria.",
          "Acceso protegido con verificación de contraseña para entrar a la pestaña de Configuración.",
        ],
      },
      {
        title: "🎨 Experiencia de Usuario & Visual",
        items: [
          "Insignia de versión interactiva en la barra superior de navegación.",
          "Fechas legibles en gráficas estadísticas sin timestamps extensos.",
          "Mantenimiento del botón de enlace público en el encabezado del cliente seleccionado.",
        ],
      },
      {
        title: "🛡️ Seguridad y Buenas Prácticas",
        items: [
          "Nuevo endpoint backend POST /api/auth/verify-password para validación segura.",
          "Regla obligatoria de documentación de releases integrada en el proyecto.",
          "Protección de archivos .env en .gitignore.",
        ],
      },
    ],
  },
];
