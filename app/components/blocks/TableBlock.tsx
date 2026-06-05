import type { BlockComponentProps } from './blockRegistry'

type TableCell = {
  _key?: string
  text: string
}

type TableRow = {
  _key?: string
  isHeader: boolean
  cells: TableCell[]
}

export function TableBlock({ data }: BlockComponentProps) {
  const rows: TableRow[] = data?.rows ?? []
  if (rows.length === 0) return null

  const headerRows = rows.filter((r) => r.isHeader)
  const bodyRows = rows.filter((r) => !r.isHeader)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {headerRows.length > 0 && (
          <thead>
            {headerRows.map((row, ri) => (
              <tr key={row._key ?? ri} className="bg-[var(--color-zal)] text-white">
                {row.cells.map((cell, ci) => (
                  <th
                    key={cell._key ?? ci}
                    scope="col"
                    className="px-3 py-2 text-left font-semibold"
                  >
                    {cell.text}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
        )}
        <tbody>
          {bodyRows.map((row, ri) => (
            <tr key={row._key ?? ri} className="border-b border-stone-200 even:bg-stone-50">
              {row.cells.map((cell, ci) => (
                <td key={cell._key ?? ci} className="px-3 py-2 align-top">
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
