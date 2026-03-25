import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';
import { productApi } from '../../utils/api';

export default function BulkUploadProductsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const category = location.pathname.split('/')[0] || 'unknown';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch recent bulk uploaded products
      const res = await productApi.getProductsByCategory(category);
      const allProducts = res?.data || [];
      
      // Filter to only show recently uploaded bulk products (those uploaded in last 24 hours)
      const bulkProducts = allProducts.filter((p) => {
        const uploadTime = new Date(p.createdAt);
        const now = new Date();
        const hoursDiff = (now - uploadTime) / (1000 * 60 * 60);
        return hoursDiff < 24 && p.isBulkUpload;
      });
      
      setProducts(bulkProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productApi.deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.ProductName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.ProductCode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.IsActive) ||
        (statusFilter === 'inactive' && !product.IsActive);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'name') {
        return a.ProductName?.localeCompare(b.ProductName);
      } else if (sortBy === 'price') {
        return (a.ProductsVariantions?.[0]?.ProductPrice || 0) - (b.ProductsVariantions?.[0]?.ProductPrice || 0);
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C64091] mx-auto mb-4"></div>
          <p className="text-[#6B7A99]">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">Bulk Uploaded Products</h2>
              <p className="text-sm text-[#6B7A99]">
                {filteredProducts.length} products from your bulk upload
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/sellerhub')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Seller Hub
            </Button>
          </div>

          {/* Filters & Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7A99] w-4 h-4" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price">Price (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Filter className="w-16 h-16 mx-auto mb-4 text-[#6B7A99]" />
            <h3 className="text-lg font-semibold text-[#111827] mb-2">
              No products found
            </h3>
            <p className="text-sm text-[#6B7A99]">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Your bulk uploaded products will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Product Image */}
                <div className="h-48 bg-[#F8F9FA] flex items-center justify-center">
                  {product.ProductImage?.[0] ? (
                    <img
                      src={product.ProductImage[0]}
                      alt={product.ProductName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-[#6B7A99] text-center">
                      <Eye className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No Image</p>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-[#111827] line-clamp-2">
                      {product.ProductName}
                    </h3>
                    {product.IsActive ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-[#6B7A99] mb-3 line-clamp-2">
                    {product.ProductDescription}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-[#6B7A99]">Price</p>
                      <p className="text-lg font-bold text-[#C64091]">
                        ₹{product.ProductsVariantions?.[0]?.ProductPrice || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#6B7A99]">Stock</p>
                      <p className="text-sm font-semibold text-[#111827]">
                        {product.ProductsVariantions?.[0]?.StockQuantity || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-[#6B7A99] mb-1">Product Code</p>
                    <p className="text-sm font-mono text-[#111827]">
                      {product.ProductCode}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/preview/${product._id}`)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/${category}/general-info/${product._id}`)
                      }
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
