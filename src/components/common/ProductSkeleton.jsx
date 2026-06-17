const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      
      {/* 1. The Image Placeholder */}
      <div className="w-full h-48 bg-gray-200"></div>

      <div className="p-5">
        {/* 2. Title & Price Placeholders */}
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="h-5 bg-gray-200 rounded-md w-2/3"></div>
          <div className="h-6 bg-brand-accent/20 rounded-md w-1/4"></div>
        </div>

        {/* 3. Category & Condition Tags Placeholders */}
        <div className="flex gap-2 mb-6">
          <div className="h-6 bg-gray-100 rounded-lg w-20"></div>
          <div className="h-6 bg-gray-100 rounded-lg w-16"></div>
        </div>

        {/* 4. Seller Info Footer Placeholder */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
          <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
        </div>
      </div>
      
    </div>
  );
};

export default ProductSkeleton;