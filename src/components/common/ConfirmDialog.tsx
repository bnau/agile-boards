import { useEffect } from 'react';

interface ConfirmDialogProps {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	dangerous?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export const ConfirmDialog = ({
	title,
	message,
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	dangerous = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) => {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	}, [onCancel]);

	return <div className="agile-overlay" onClick={onCancel}>
		<div
			className="agile-overlay__content agile-confirm-dialog"
			onClick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-title"
		>
			<h3 id="confirm-title" className="agile-confirm-dialog__title">{title}</h3>
			<p className="agile-confirm-dialog__message">{message}</p>
			<div className="agile-confirm-dialog__actions">
				<button className="agile-btn" onClick={onCancel}>{cancelLabel}</button>
				<button
					className={`agile-btn ${dangerous ? 'agile-btn--danger-solid' : 'agile-btn--primary'}`}
					onClick={onConfirm}
					autoFocus
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>;
};
