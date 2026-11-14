export const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="empty-state p-4 text-center">
        <h2 className="h5">{title}</h2>
        <p className="text-body-secondary mb-0">{description}</p>
    </div>
);
