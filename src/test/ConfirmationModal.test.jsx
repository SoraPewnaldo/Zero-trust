import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from '@/components/ConfirmationModal';

describe('ConfirmationModal', () => {
    it('should not render when isOpen is false', () => {
        const { container } = render(
            <ConfirmationModal
                isOpen={false}
                title="Test"
                message="Test message"
                onConfirm={() => { }}
                onCancel={() => { }}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                title="CONFIRM ACTION"
                message="Are you sure?"
                onConfirm={() => { }}
                onCancel={() => { }}
            />
        );

        expect(screen.getByText('CONFIRM ACTION')).toBeInTheDocument();
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();

        render(
            <ConfirmationModal
                isOpen={true}
                title="Test"
                message="Test message"
                confirmText="YES"
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        );

        const confirmButton = screen.getByText('YES');
        fireEvent.click(confirmButton);

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();

        render(
            <ConfirmationModal
                isOpen={true}
                title="Test"
                message="Test message"
                cancelText="NO"
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        );

        const cancelButton = screen.getByText('NO');
        fireEvent.click(cancelButton);

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should render with custom button text', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                title="Test"
                message="Test message"
                confirmText="FIRE EMPLOYEE"
                cancelText="CANCEL"
                onConfirm={() => { }}
                onCancel={() => { }}
            />
        );

        expect(screen.getByText('FIRE EMPLOYEE')).toBeInTheDocument();
        expect(screen.getByText('CANCEL')).toBeInTheDocument();
    });

    it('should apply danger variant styles', () => {
        const { container } = render(
            <ConfirmationModal
                isOpen={true}
                title="Test"
                message="Test message"
                variant="danger"
                onConfirm={() => { }}
                onCancel={() => { }}
            />
        );

        const modal = container.querySelector('.border-red-500\\/30');
        expect(modal).toBeInTheDocument();
    });
});
