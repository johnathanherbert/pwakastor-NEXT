import { format } from 'date-fns';
import { Badge, Card, Table } from 'flowbite-react';
import { HiOutlineTag as TagIcon, HiOutlineCalendar as CalendarIcon, HiOutlineClock as ClockIcon } from 'react-icons/hi2';

export default function OldestLots({ oldestLots }) {
  return (
    <div className="space-y-6">
      {/* Header com Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600">
          <div className="text-white">
            <p className="text-sm font-medium opacity-80">Lotes em Ajuste</p>
            <h3 className="text-2xl font-bold">{oldestLots.adjustment.length}</h3>
            <p className="text-xs opacity-70 mt-1">Necessitam atenção imediata</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600">
          <div className="text-white">
            <p className="text-sm font-medium opacity-80">Lotes Regulares</p>
            <h3 className="text-2xl font-bold">{oldestLots.regular.length}</h3>
            <p className="text-xs opacity-70 mt-1">Em monitoramento</p>
          </div>
        </Card>
      </div>

      {/* Tabelas Responsivas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lotes em Ajuste */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
              Lotes em Ajuste
            </h5>
            <Badge color="purple" size="sm">
              Top 5
            </Badge>
          </div>
          <Table>
            <Table.Head>
              <Table.HeadCell>Lote</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Dias</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {oldestLots.adjustment.map((lot) => (
                <Table.Row 
                  key={lot.lote}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                      <span className="font-semibold">{lot.codigo_materia_prima}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {lot.descricao}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        lot.status === 'critical' ? 'failure' :
                        lot.status === 'warning' ? 'warning' :
                        lot.status === 'attention' ? 'warning' :
                        'success'
                      }
                      size="sm"
                    >
                      {lot.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center space-x-1 text-sm">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <span>{lot.daysInArea}d</span>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card>

        {/* Lotes Regulares */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
              Lotes Regulares
            </h5>
            <Badge color="blue" size="sm">
              Top 5
            </Badge>
          </div>
          <Table>
            <Table.Head>
              <Table.HeadCell>Lote</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Dias</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {oldestLots.regular.map((lot) => (
                <Table.Row 
                  key={lot.lote}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                      <span className="font-semibold">{lot.codigo_materia_prima}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {lot.descricao}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        lot.status === 'critical' ? 'failure' :
                        lot.status === 'warning' ? 'warning' :
                        lot.status === 'attention' ? 'warning' :
                        'success'
                      }
                      size="sm"
                    >
                      {lot.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center space-x-1 text-sm">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <span>{lot.daysInArea}d</span>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card>
      </div>
    </div>
  );
}
