export default function PendingRequestsTable({
  requests,
  onApprove,
  onReject,
  loading = false,
}) {
  if (loading) {
    return <p>Carregando solicitações...</p>;
  }

  if (!requests.length) {
    return <p>Nenhuma solicitação pendente para os filtros selecionados.</p>;
  }

  return (
    <table className="requests-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Colaborador</th>
          <th>Início</th>
          <th>Fim</th>
          <th>Dias</th>
          <th>Justificativa</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr key={request.ID || request.id}>
            <td>{request.ID || request.id}</td>
            <td>{request.EMPLOYEE_NAME || request.employee_name}</td>
            <td>{new Date(request.START_DATE || request.start_date).toISOString().slice(0, 10)}</td>
            <td>{new Date(request.END_DATE || request.end_date).toISOString().slice(0, 10)}</td>
            <td>{request.REQUESTED_DAYS || request.requested_days}</td>
            <td>{request.JUSTIFICATION || request.justification || "-"}</td>
            <td className="table-actions">
              <button type="button" onClick={() => onApprove(request)}>
                Aprovar
              </button>
              <button type="button" className="danger" onClick={() => onReject(request)}>
                Reprovar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
