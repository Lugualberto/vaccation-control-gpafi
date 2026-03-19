export default function PendingRequestsTable({
  requests,
  onApprove,
  onReject,
  loading = false,
}) {
  if (loading) {
    return <p>Loading requests...</p>;
  }

  if (!requests.length) {
    return <p>No pending requests for the selected filters.</p>;
  }

  return (
    <table className="requests-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Employee</th>
          <th>Start</th>
          <th>End</th>
          <th>Days</th>
          <th>Notes</th>
          <th>Actions</th>
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
                Approve
              </button>
              <button type="button" className="danger" onClick={() => onReject(request)}>
                Reject
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
