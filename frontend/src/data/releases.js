export const releases = [
  {
    version: "1.8.4",
    date: "12 de Septiembre, 2026",
    tagline:
      "Selector interactivo y configuración completa de proveedores WhatsApp (OpenWA / Meta Cloud API)",
    highlights: [
      "Soporte completo de OpenWA restaurado en interfaz: Se agregó el selector interactivo de proveedor de WhatsApp en Configuración con todos los campos necesarios para conectar instancias Docker / VPS de OpenWA.",
      "Conmutación flexible de proveedor: Posibilidad de alternar entre Meta WhatsApp Cloud API Oficial y OpenWA Gateway autohospedado con guardado automático de credenciales.",
    ],
    sections: [
      {
        title: "💬 Integración de WhatsApp",
        items: [
          "Selector de proveedor interactivo con tarjetas visuales entre OpenWA Gateway y Meta WhatsApp Cloud API.",
          "Campos de configuración para OpenWA: URL del Gateway, ID de Sesión, API Key / Token y Lada por defecto.",
          "Estado de conexión dinámico según el proveedor activo y compatibilidad total con el backend.",
        ],
      },
    ],
  },
  {
    version: "1.8.3",
    date: "12 de Septiembre, 2026",
    tagline:
      "Filtro temporal unificado para estadísticas de comportamiento en mostrador",
    highlights: [
      "Control de Periodo Unificado en Horarios & Hábitos: Nueva botonera de filtrado temporal (Semana actual por defecto, Quincena actual, Mes actual e Histórico) que sincroniza instantáneamente las 3 gráficas de comportamiento.",
      "Análisis coordinado de horas pico, días activos y métodos de pago: Permite evaluar la afluencia de clientes y métodos de cobro en ventanas de tiempo precisas para mejor toma de decisiones operativas.",
    ],
    sections: [
      {
        title: "📈 Estadísticas & Comportamiento",
        items: [
          "Endpoint optimizado GET /api/stats/behavior con soporte de parámetros de rango temporal (semana, quincena, mes, historico) en zona horaria local.",
          "Filtro unificado con selector interactivo y actualización asíncrona en la pestaña de Comportamiento.",
          "Sincronización simultánea de gráficas: Horas Pico en Mostrador, Días con Mayor Actividad y Métodos de Pago Más Utilizados.",
        ],
      },
    ],
  },
  {
    version: "1.8.2",
    date: "12 de Septiembre, 2026",
    tagline:
      "Venta Rápida integrada en Clientes y pestaña dedicada de Lista de Precios",
    highlights: [
      "Venta Rápida de Mostrador en Clientes: Nuevo botón de acceso directo en el directorio de clientes para registrar ventas al contado a público general en un modal optimizado sin salir del mostrador.",
      "Pestaña 'Precios' simplificada: La pestaña anterior 'Punto de Venta' ahora se llama 'Precios' y se enfoca exclusivamente en la consulta rápida de precios de productos con buscador instantáneo y diseño limpio.",
    ],
    sections: [
      {
        title: "⚡ Flujo de Mostrador & Clientes",
        items: [
          "Modal flotante de Venta Rápida con selección de productos por SweetCombobox, selector de cantidades, desglose y métodos de pago.",
          "Botonera superior de Clientes actualizada con botones '+ Nuevo Cliente' y 'Venta Rápida'.",
        ],
      },
      {
        title: "🏷️ Catálogo & Precios",
        items: [
          "Vista dedicada de Lista de Precios (/precios) con tabla limpia de productos y precios unitarios.",
          "Navegación de barra superior renombrada a 'Precios'.",
        ],
      },
    ],
  },
  {
    version: "1.8.1",
    date: "12 de Septiembre, 2026",
    tagline:
      "Corrección de registro de compras y soporte de centavos en puntos de recompensa",
    highlights: [
      "Corrección crítica en registro de compras: Eliminación de error en backend al registrar compras a crédito o de contado que impedía guardar transacciones.",
      "Soporte de decimales/centavos en puntos de recompensa: Se amplió el selector numérico a dos decimales (step='0.01'), permitiendo capturar y editar saldos fraccionarios de puntos (ej. 8.55 pts) sin bloqueos del navegador.",
      "Corrección de agregación SQL en estadísticas: Resolución de error 500 en GET /api/stats (agrupación GROUP BY de paid_amount) y eliminación de cláusulas duplicadas.",
    ],
    sections: [
      {
        title: "🛒 Compras & Puntos",
        items: [
          "Resolución de error 400 'callback is not a function' en POST /api/clients/:id/purchase.",
          "Campos de puntos de recompensa y redención ahora aceptan centavos con precisión de 0.01 en modales de Cliente y Movimientos.",
        ],
      },
      {
        title: "📊 Estabilidad Contable",
        items: [
          "Corrección de agregación SUM en paid_amount para la consulta diaria de /api/stats.",
          "Limpieza de cláusulas SQL redundantes en flujo de caja y ventas por día.",
        ],
      },
    ],
  },
  {
    version: "1.8.0",
    date: "12 de Septiembre, 2026",
    tagline:
      "Skeletons de carga, optimización de rendimiento y registro de compras de contado",
    highlights: [
      "Skeletons animados de carga: Efecto visual moderno tanto en el directorio de clientes como en el libro contable de movimientos mientras se cargan los datos del servidor.",
      "Registro fiel de compras de contado: Se almacena y visualiza el importe real pagado (paid_amount) en compras al contado de clientes, corrigiendo el valor de $0.00 en ventas del día y portales públicos.",
      "Sincronización horaria precisa: Reportes de ventas, flujo de efectivo y estadísticas sincronizados con la zona horaria America/Mexico_City.",
      "Code-Splitting y carga ultrarrápida en móviles: Lazy loading dinámico de Compras y Estadísticas (ahorrando ~480 kB en el bundle inicial).",
      "Buscador ágil con botón de limpieza: Botón de 1 toque ('X') en el punto de venta y catálogo de inventario.",
      "Optimización de Base de Datos: Índices creados para acelerar consultas complejas de movimientos, ventas y stock.",
    ],
    sections: [
      {
        title: "⚡ Rendimiento & Experiencia Móvil",
        items: [
          "Skeletons fluidos en la pestaña de Clientes eliminando saltos de diseño durante la carga.",
          "Carga bajo demanda (React.lazy) para Compras y el paquete pesado de gráficas de Estadísticas.",
          "Botones rápidos para limpiar el campo de búsqueda sin tener que borrar manualmente.",
        ],
      },
      {
        title: "📊 Precisión Contable & Datos",
        items: [
          "Columna paid_amount para registrar pagos de contado dentro del historial de cada cliente.",
          "Cálculo de fechas y agrupaciones por hora y día respetando el horario local mexicano.",
          "Índices optimizados en Postgres (Neon) para agilizar búsquedas de inventario y tickets.",
        ],
      },
    ],
  },
  {
    version: "1.7.9",
    date: "11 de Septiembre, 2026",
    tagline:
      "Distintivos mensuales para los tres mejores clientes y corrección del despliegue",
    highlights: [
      "La vista personalizada de cada cliente muestra medalla, lugar y total acumulado cuando está entre los tres primeros del mes.",
      "El ranking mensual reutiliza el criterio de monto gastado y respeta la zona horaria de México.",
      "Validación del build frontend para evitar dejar incompleta la publicación en Vercel.",
      "Selector de Criterio de Ranking: Posibilidad de alternar el orden entre Total Gastado ($), Más Visitas (Tickets) y Más Piezas (Unidades), además de clic directo en las columnas de la tabla.",
      "Tolerancia SQL en Compras: Cláusula WHERE ampliada para capturar todas las compras a crédito y de contado sin depender exclusivamente de palabras clave rígidas.",
      "Cross-Selling con Nombres de Productos: En el podio, tabla y detalle de cliente se muestran los combos específicos de productos que compran juntos (ej. 'Churros Soles + Chicle Trident') y las veces que se han combinado.",
      "Sección Dedicada de Combos Habituales: Desglose claro de qué suele llevarse junto cada cliente en su expediente de estadísticas.",
    ],
    sections: [
      {
        title: "🏆 Inteligencia de Clientes & Ranking",
        items: [
          "Ordenamiento por defecto por mayor volumen monetario comprado ($ gastado).",
          "Podio dinámico que se recalcula según el criterio seleccionado (Monto, Frecuencia o Piezas).",
          "Encabezados de tabla interactivos para ordenar con un solo clic.",
        ],
      },
      {
        title: "🤝 Análisis de Cross-Selling",
        items: [
          "Algoritmo de co-ocurrencia por pares de artículos en carritos de 2 o más productos.",
          "Visualización de los combos favoritos por cliente con conteo exacto de frecuencia conjunta.",
        ],
      },
    ],
  },
  {
    version: "1.7.6",
    date: "11 de Septiembre, 2026",
    tagline:
      "Restauración de Contenedor Centrado en Escritorio y Selección Automática de Cliente",
    highlights: [
      "Contenedor centrado en desktop: Se corrigió la regla max-w-7xl en el layout principal y barra de navegación (px-4 sm:px-6 lg:px-8), devolviendo los márgenes y centrado balanceado en pantallas grandes.",
      "Selección automática de cliente: Al ingresar al módulo de Clientes, el primer cliente del directorio se autoselecciona por defecto en desktop mostrando su historial inmediatamente sin clics adicionales.",
      "Preservación mobile-first: En dispositivos móviles la navegación se mantiene en la lista general inicial de clientes sin transiciones forzadas.",
    ],
    sections: [
      {
        title: "🖥️ Layout & Experiencia de Escritorio",
        items: [
          "Eliminación de la sobreescritura max-w-full que expandía el contenido de borde a borde en monitores anchos.",
          "Padding responsivo unificado max-w-7xl mx-auto px-4 sm:px-6 lg:px-8.",
        ],
      },
      {
        title: "👥 Directorio de Clientes",
        items: [
          "Carga inmediata del expediente y movimientos del primer cliente al abrir la vista.",
          "Sincronización fluida entre lista y panel de detalles en pantallas medianas y grandes.",
        ],
      },
    ],
  },
  {
    version: "1.7.5",
    date: "11 de Septiembre, 2026",
    tagline:
      "Hotfix: Carga de Estadísticas de Clientes en Producción/Vercel y Tolerancia de Búsqueda SQL",
    highlights: [
      "Activación de carga de datos en Estadísticas de Clientes: Se eliminó la condición que bloqueaba la llamada API cuando apiBase es una cadena vacía (ruta relativa estándar en Vercel/producción y redes locales).",
      "Consistencia de servicios API: Importación directa de apiBase y authFetch con valores por defecto resilientes en StatsPage.jsx.",
      "Consultas SQL de compras con ILIKE: Las compras de clientes ahora se localizan mediante búsquedas insensibles a mayúsculas/minúsculas (ILIKE '%compra%') para abarcar todos los conceptos históricos.",
    ],
    sections: [
      {
        title: "⚡ Conectividad & Datos",
        items: [
          "Resolución de llamadas relativas a /api/stats/clients en cualquier entorno de hosting (Vercel, LAN, localhost).",
          "Mapeo de compras de clientes con conceptos mixtos y compras al contado garantizado.",
        ],
      },
    ],
  },
  {
    version: "1.7.4",
    date: "11 de Septiembre, 2026",
    tagline:
      "Corrección de Safe Areas Móviles (Notch/Status Bar) y Blindaje contra Desbordes en Clientes",
    highlights: [
      "Integración nativa de Safe Areas (iPhone/Android): Eliminación del área blanca en la barra de estado y notch superior. El Navbar ahora cubre el área de notificaciones con pt-[env(safe-area-inset-top)] y color translúcido exacto.",
      "Sincronización dinámica de theme-color: Sincronización en tiempo real de meta theme-color (#181B1E en oscuro, #FFFFFF en claro) y estilo black-translucent para iOS Safari / PWA.",
      "Blindaje contra desbordes en Clientes: Estructura flex y grid con min-w-0 max-w-full y overflow-x-hidden para impedir cualquier desplazamiento lateral de la pantalla en dispositivos móviles.",
      "Header de Cliente adaptativo: Botones 'Enlace Público' y 'WhatsApp' con distribución responsiva fluida que no empuja el nombre del cliente ni fuerza el ancho del viewport.",
      "Libro de movimientos calibrado: Ancho base adaptado a 360px con scroll horizontal contenido estrictamente dentro de la tabla sin mover la página.",
      "Corrección en Modal de Fiar/Abonar: Sustitución de selectores con w-13 no estándar por clases calibradas (w-12, w-14 shrink-0) en la lista de dulces para asegurar que quepa en cualquier teléfono.",
    ],
    sections: [
      {
        title: "📱 Safe Areas & Experiencia SPA",
        items: [
          "Eliminación de padding-top en #root para que la barra de navegación toque la cima física del dispositivo.",
          "Estilos html y body con background exacto para prevenir destellos blancos durante el rebote de scroll.",
          "Efecto de tema que actualiza dinámicamente las etiquetas meta de color del sistema.",
        ],
      },
      {
        title: "🛡️ Protección Mobile-First contra Desbordes",
        items: [
          "Contenedor principal con min-w-0 y overflow-x-hidden permanente.",
          "Fila de productos en modal de movimientos con anchos compactos y protección shrink-0.",
          "Selectores de método de pago con truncado elástico para pantallas desde 320px.",
        ],
      },
    ],
  },
  {
    version: "1.7.3",
    date: "11 de Septiembre, 2026",
    tagline:
      "Tab de Clientes en Estadísticas: Podio Top 3, Hábitos de Consumo, Buscador y Detalle por Cliente",
    highlights: [
      "Pestaña 'Clientes' en Estadísticas: Módulo analítico dedicado al comportamiento de compra tanto de clientes registrados como de ventas a público general.",
      "Podio de honor Top 3: Destacado visual con medallas de Oro 🥇, Plata 🥈 y Bronce 🥉 para los compradores líderes del periodo.",
      "Filtros de periodo dinámicos: Selector interactivo entre Histórico (por defecto), Mes actual, Quincena actual y Semana actual.",
      "Métricas avanzadas de cliente: Producto dulce favorito (piezas y nombre), última compra, tickets totales, gasto acumulado, ticket promedio, tasa de cross-selling (% tickets multitítulo), día preferido de compra y frecuencia promedio en días.",
      "Buscador predictivo con botón 'x': Encuentra al instante cualquier cliente o 'Público General (Mostrador)' con borrado rápido en el campo de texto.",
      "Modal interactivo de Detalle por Cliente: Gráfico de barras de su Top 5 dulces favoritos, desglose de métodos de pago y lista de tickets recientes.",
    ],
    sections: [
      {
        title: "🏆 Podio & Hábitos de Consumo",
        items: [
          "Tarjetas distinguidas con gradientes temáticos para el Top 3 con insignias de medallas.",
          "Cálculo de recurrencia en días entre compras sucesivas.",
          "Detección de productos preferidos y cross-selling por cliente.",
        ],
      },
      {
        title: "🔍 Buscador & Modal Drill-Down",
        items: [
          "Búsqueda instantánea con botón de limpieza 'x' integrado.",
          "Sub-vista emergente con desglose de preferencias de dulces y métodos de pago.",
          "Visualización adaptativa 100% Mobile-First para celulares y pantallas de mostrador.",
        ],
      },
    ],
  },
  {
    version: "1.7.2",
    date: "11 de Septiembre, 2026",
    tagline:
      "Arquitectura Mobile-First en Clientes, Detalle de Tickets y Compras al Contado Unificadas",
    highlights: [
      "Mobile-First por diseño: Rediseño responsivo en Clientes y Modal de Movimientos optimizado para smartphones (360px+), sin desbordes horizontales.",
      "Detalle de ticket en cada movimiento: Nuevo botón interactivo para consultar la lista de dulces adquiridos, cantidades, precios unitarios y subtotales.",
      "Compras al contado unificadas: Las compras pagadas al instante ahora generan 1 solo movimiento contable con impacto neto de $0.00 en la deuda del cliente.",
      "Desglose de deuda en WhatsApp: Notificaciones automáticas y estados de cuenta ahora incluyen el desglose detallado de compras adeudadas cuando hay saldo pendiente.",
      "Limpieza de interfaz: Eliminación del botón redundante de 'Desglose' en favor de una botonera simétrica 50/50 de '+ Fiar Producto' y '+ Registrar Abono'.",
    ],
    sections: [
      {
        title: "📱 Arquitectura Mobile-First",
        items: [
          "Diseño 100% Mobile-First: todos los componentes, modales y tablas están concebidos prioritariamente para dispositivos móviles.",
          "Botonera de acciones principales en grid de 2 columnas al 50% de ancho sin cortes ni saltos incómodos.",
          "Contenedor del libro de movimientos con scroll horizontal suave y min-width adaptativo para proteger el ancho de pantalla.",
          "Modal de movimiento con espaciados compactos, campos numéricos adaptados y selector de productos sin desbordamiento.",
        ],
      },
      {
        title: "🧾 Detalle de Tickets & Movimientos",
        items: [
          "Modal emergente de Detalle de Movimiento con fecha, concepto, método de pago, productos desglosados y puntos otorgados.",
          "Visualización en libro contable con etiqueta distintiva de 'Contado' para compras inmediatas.",
        ],
      },
      {
        title: "💬 Mensajería WhatsApp Mejorada",
        items: [
          "Inclusión automática de la lista de compras pendientes (concepto, fecha y artículos) en tickets y estados de cuenta cuando hay deuda activa.",
        ],
      },
    ],
  },
  {
    version: "1.7.1",
    date: "11 de Septiembre, 2026",
    tagline:
      "Ajustes de Zona Horaria Mostrador, Filtros de Flujo de Caja y Alertas Descartables",
    highlights: [
      "Alineación horaria precisa: Corrección de zona horaria (UTC a America/Mexico_City) para reflejar fielmente las ventas de 08:00 a 17:00 en mostrador.",
      "Días con mayor actividad ajustados exclusivamente de Lunes a Viernes (excluyendo fines de semana cerrados).",
      "Margen de gracia para stock estancado: Se protegen los productos nuevos (>15 días de antigüedad en catálogo) antes de considerarlos estancados.",
      "Filtros de periodo dinámicos en Flujo de Caja Real: Selector para Semana actual, Quincena actual (mexicana 1-15 y 16-fin), Mes actual e Histórico completo.",
      "Control de saturación en histórico: Decimación automática de etiquetas en el eje X para evitar empalmes de fechas.",
      "Alertas públicas descartables: Las tarjetas de advertencia de límite de crédito y días de adeudo prolongado en /c/:code ahora cuentan con botón para cerrarlas.",
    ],
    sections: [
      {
        title: "🕒 Horarios & Jornada Comercial",
        items: [
          "Conversión SQL directa con AT TIME ZONE a 'America/Mexico_City' para agrupar horas y días en tiempo local real.",
          "Histograma enfocado en el horario de apertura de la tiendita (08:00 a 17:00) sincronizando el pico de mostrador.",
          "Exclusión de Sábado y Domingo en la gráfica de días fuertes de la semana.",
        ],
      },
      {
        title: "💵 Filtros de Flujo de Caja",
        items: [
          "Botones interactivos de filtrado por Semana, Quincena, Mes e Histórico sin recargar página.",
          "Eje horizontal optimizado con intervalo adaptativo para visualización histórica despejada.",
        ],
      },
      {
        title: "📱 Vista Pública del Cliente",
        items: [
          "Botón de cierre suave en alertas de sobregiro de crédito y adeudo acumulado con micro-animaciones.",
        ],
      },
    ],
  },
  {
    version: "1.7.0",
    date: "11 de Septiembre, 2026",
    tagline:
      "Centro de Inteligencia & Estadísticas de Negocio: 10 Módulos Analíticos",
    highlights: [
      "Dashboard analítico completo de 10 módulos con Recharts (Area, Bar, Pie y Line) sin alterar el esquema de BD.",
      "Cinta de KPIs financieros: Ticket Promedio por venta, Tasa de Cobranza mensual (%), Capital Estancado e Ingresos Totales.",
      "Flujo de caja dinámico (AreaChart): Desglose comparativo de ventas de Contado vs. Fiado otorgado vs. Abonos recuperados.",
      "Análisis de hábitos de mostrador: Histograma de Horas Pico de venta y distribución de ingresos por Día de la Semana.",
      "Gráfica de métodos de pago (PieChart tipo dona) con desglose de Efectivo, Fiado, Transferencia SPEI, Tarjeta y Puntos.",
      "Matriz de rentabilidad real por producto: Cálculo dinámico de ganancia neta en pesos (Venta - Compra) y margen porcentual unitario.",
      "Detección de productos afines (Cross-Selling): Análisis automático de parejas de dulces comprados juntos en la misma transacción.",
      "Distribución de deuda por antigüedad (FIFO): Desglose de saldos pendientes en 1-7d, 8-15d, 16-30d y +30d.",
      "Alertas de stock estancado: Identificación de productos con existencias y baja rotación calculando el capital congelado.",
    ],
    sections: [
      {
        title: "📊 Analítica & Finanzas",
        items: [
          "Cálculo en tiempo real de Ticket Promedio basado en todas las operaciones registradas.",
          "Monitoreo de recuperación de créditos mensuales y abonos recuperados.",
          "Flujo de caja diario de los últimos 14 días con áreas apiladas de contado, fiado y abonos.",
        ],
      },
      {
        title: "🕒 Hábitos de Consumo & Operaciones",
        items: [
          "Histograma de 24 horas para identificar las horas pico de mostrador.",
          "Comparativa de ventas por día de la semana (Lunes a Domingo).",
          "Distribución porcentual por medios de pago con leyenda interactiva.",
        ],
      },
      {
        title: "🍬 Productos & Cartera",
        items: [
          "Tabla de rentabilidad neta con cálculo de utilidad y porcentaje de margen por producto.",
          "Detector de afinidad de compra en cesta para optimizar la exhibición en mostrador.",
          "Gráfica de barras cromática para envejecimiento de deuda según días de atraso.",
          "Módulo de stock estancado con métrica de capital detenido.",
        ],
      },
    ],
  },
  {
    version: "1.6.1",
    date: "11 de Septiembre, 2026",
    tagline:
      "Límite de Crédito General $50, Alerta de Antigüedad de Deuda y Stock Negativo en Rojo",
    highlights: [
      "Límite máximo de crédito predeterminado para todos los clientes fijado en $50.00, configurable de manera global desde la pestaña de Ajustes.",
      "Compras fiadas flexibles: si un cliente sobrepasa el límite de crédito se le permite seguir fiando, pero se emite una alerta destacada tras registrar cada movimiento.",
      "Alerta de límite en Estado de Cuenta público (/c/:code) advirtiendo al cliente cuando su deuda excede el límite permitido.",
      "Contador y alerta de antigüedad de adeudo continuo: detecta y notifica visualmente saldos pendientes de pago de más de 15 días acumulados.",
      "Distintivo de stock negativo en rojo (#DC2626) en el catálogo de productos de inventario para advertir discrepancias físicas inmediatas.",
    ],
    sections: [
      {
        title: "💳 Gestión de Crédito & Finanzas",
        items: [
          "Nuevo parámetro default_credit_limit en Ajustes generales del sistema.",
          "Cálculo de límite efectivo (personalizado o default de $50) en backend y frontend.",
          "Modal de confirmación interactiva con aviso de rebase de límite en compras y abonos.",
        ],
      },
      {
        title: "⏰ Antigüedad de Saldos",
        items: [
          "Algoritmo FIFO para calcular días exactos de adeudo ininterrumpido a partir de compras pendientes.",
          "Notificación para saldos con más de 15 días en la libreta y en el enlace público del cliente.",
        ],
      },
      {
        title: "📦 Inventario",
        items: [
          "Distintivo rojo de alta visibilidad para productos con existencias negativas.",
          "Filtro de productos agotados ajustado para incluir productos con stock menor o igual a cero.",
        ],
      },
    ],
  },
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
