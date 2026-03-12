/**
 * Muestra las variantes seleccionadas de un item del carrito como badges compactos.
 * Acepta variantesSeleccionadas (objeto) o personalizacion (string legado).
 */
export default function VariantesBadges({ item, size = 'sm' }: { item: any; size?: 'xs' | 'sm' }) {
  const vars = item?.variantesSeleccionadas;
  const texto = item?.personalizacion;

  const entries = vars ? Object.values(vars).filter(Boolean) : [];
  if (entries.length === 0 && !texto) return null;

  const base = size === 'xs'
    ? 'text-[9px] px-1.5 py-0.5 rounded-md font-bold'
    : 'text-[10px] px-2 py-1 rounded-lg font-bold';

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map((v: any, i: number) => {
        const label = v.valor_usuario   // texto libre
          ? `${v.tipo_nombre ? v.tipo_nombre + ': ' : ''}${v.valor_usuario}`
          : v.etiqueta
            ? `[${v.etiqueta}] ${v.valor}`
            : v.valor || JSON.stringify(v);
        return (
          <span key={i} className={`bg-slate-100 text-slate-700 ${base}`}>
            {label}
            {v.precio_extra > 0 && <span className="ml-1 text-green-600">+{v.precio_extra}€</span>}
          </span>
        );
      })}
      {texto && (
        <span className={`bg-amber-50 text-amber-700 border border-amber-200 ${base}`}>
          ✏️ {texto}
        </span>
      )}
    </div>
  );
}
