import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from '../components/shared/Skeleton';

describe('Skeleton Components', () => {
    describe('Skeleton', () => {
        it('should render with default props', () => {
            const { container } = render(<Skeleton />);
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toBeInTheDocument();
            expect(skeleton).toHaveClass('skeleton');
            expect(skeleton).toHaveClass('rounded-md');
        });

        it('should apply custom width and height', () => {
            const { container } = render(<Skeleton width={100} height={50} />);
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toHaveStyle({ width: '100px', height: '50px' });
        });

        it('should apply different rounded variants', () => {
            const { container } = render(<Skeleton rounded="full" />);
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toHaveClass('rounded-full');
        });

        it('should apply custom className', () => {
            const { container } = render(<Skeleton className="my-custom-class" />);
            const skeleton = container.firstChild as HTMLElement;

            expect(skeleton).toHaveClass('my-custom-class');
        });
    });

    describe('SkeletonText', () => {
        it('should render default 3 lines', () => {
            const { container } = render(<SkeletonText />);
            const skeletons = container.querySelectorAll('.skeleton');

            expect(skeletons).toHaveLength(3);
        });

        it('should render custom number of lines', () => {
            const { container } = render(<SkeletonText lines={5} />);
            const skeletons = container.querySelectorAll('.skeleton');

            expect(skeletons).toHaveLength(5);
        });
    });

    describe('SkeletonCard', () => {
        it('should render card skeleton structure', () => {
            const { container } = render(<SkeletonCard />);

            // Should have glassmorphism classes
            expect(container.firstChild).toHaveClass('bg-white/60');
            expect(container.firstChild).toHaveClass('backdrop-blur-sm');
            expect(container.firstChild).toHaveClass('rounded-2xl');
        });
    });

    describe('SkeletonTable', () => {
        it('should render default 5 rows and 4 columns', () => {
            const { container } = render(<SkeletonTable />);

            // Header row + 5 data rows = 6 rows total
            const rows = container.querySelectorAll('.flex.gap-4');
            expect(rows.length).toBeGreaterThanOrEqual(5);
        });

        it('should render custom rows and columns', () => {
            const { container } = render(<SkeletonTable rows={3} cols={2} />);

            const skeletons = container.querySelectorAll('.skeleton');
            // 2 cols in header + 3 rows * 2 cols = 2 + 6 = 8
            expect(skeletons.length).toBeGreaterThanOrEqual(8);
        });
    });
});
