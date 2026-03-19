export default function PendingRequestsTable({
  requests,
  onApprove,
  onReject,
  loading = false,
}) {
  const toDateString = (value) => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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
            <td>{toDateString(request.START_DATE || request.start_date)}</td>
            <td>{toDateString(request.END_DATE || request.end_date)}</td>
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
