export const QueryStatus = ({ loading, error }: { loading: boolean; error: string | null }) => {
    if (error) return <p className="alert alert-danger m-3" role="alert">{error}</p>;
    return loading ? <p className="text-body-secondary p-3 mb-0" role="status">Cargando…</p> : null;
};
