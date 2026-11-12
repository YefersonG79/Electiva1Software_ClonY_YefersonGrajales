export const PageHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="card-header bg-body d-flex flex-wrap align-items-center justify-content-between gap-2 p-3">
        <h1 className="h5 mb-0">{title}</h1>
        <span className="text-body-secondary small">{subtitle}</span>
    </div>
);
