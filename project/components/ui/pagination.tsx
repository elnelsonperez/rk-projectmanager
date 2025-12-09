
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Only show maximum 7 page buttons at a time
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if there are 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // If current page is among the first 3 pages
      if (currentPage <= 3) {
        pages.push(2, 3, 4, '...', totalPages);
      } 
      // If current page is among the last 3 pages
      else if (currentPage >= totalPages - 2) {
        pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } 
      // If current page is in the middle
      else {
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  // Don't render if there's only one page
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <div className="flex justify-center items-center space-x-1 py-4">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-md text-xs ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'}`}
      >
        &lt; Anterior
      </button>
      
      {/* Page numbers */}
      {pageNumbers.map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 py-1 text-xs text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page as number)}
            disabled={page === currentPage}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-xs
              ${page === currentPage 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
              }`}
          >
            {page}
          </button>
        )
      ))}
      
      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-md text-xs ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'}`}
      >
        Siguiente &gt;
      </button>
    </div>
  );
}