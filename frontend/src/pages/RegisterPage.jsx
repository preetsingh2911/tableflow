import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: 'Cafe',
    city: '',
    slug: '',
    agreeTerms: false,
  });
  const [slugPreview, setSlugPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setForm(prev => {
      const next = { ...prev, [name]: val };
      
      // Auto-generate slug from business name if user hasn't explicitly modified slug yet
      if (name === 'businessName') {
        const generatedSlug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]/g, '')
          .replace(/--+/g, '-');
        next.slug = generatedSlug;
        setSlugPreview(`Your booking page will be: ${generatedSlug}.tableflow.in`);
      }
      
      if (name === 'slug') {
        const cleanSlug = value
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .replace(/--+/g, '-');
        next.slug = cleanSlug;
        setSlugPreview(`Your booking page will be: ${cleanSlug}.tableflow.in`);
      }
      
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.slug.length < 3 || form.slug.length > 30) {
      return toast.error('Booking link must be between 3 and 30 characters');
    }
    if (!form.agreeTerms) {
      return toast.error('You must agree to the Terms & Privacy policy');
    }

    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to TableFlow 🎉');
      navigate('/dashboard/onboarding'); // Redirect to onboarding wizard
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      const errors = err.response?.data?.errors;
      if (errors?.length) {
        errors.forEach(e => toast.error(e));
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-gray-900 text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🍽️</span>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">TableFlow</span>
          </Link>
          <p className="text-gray-400 mt-2">Create your restaurant's booking page</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Name</label>
                <input name="businessName" type="text" value={form.businessName} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="The Blue Cafe" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Name</label>
                <input name="fullName" type="text" value={form.fullName} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Raj Patel" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Booking Page URL</label>
              <div className="flex flex-col">
                <div className="flex items-center bg-gray-900 border border-gray-700 rounded-md overflow-hidden focus-within:border-blue-500 transition-colors">
                  <input name="slug" type="text" value={form.slug} onChange={handleChange} className="flex-1 bg-transparent px-4 py-2 text-white focus:outline-none" placeholder="the-blue-cafe" required pattern="[a-z0-9-]+" minLength="3" maxLength="30" />
                  <span className="text-gray-500 text-sm pr-4 whitespace-nowrap">.tableflow.in</span>
                </div>
                {slugPreview && <p className="text-xs text-blue-400 mt-1">{slugPreview}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Type</label>
                <select name="businessType" value={form.businessType} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500" required>
                  <option value="Cafe">Cafe</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Bar">Bar</option>
                  <option value="Cloud Kitchen">Cloud Kitchen</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">City</label>
                <input name="city" type="text" value={form.city} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Mumbai" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="raj@mycafe.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone (+91)</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="9876543210" pattern="[0-9]{10}" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500" required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500" required minLength={8} />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-3 text-sm text-gray-300">
                <input name="agreeTerms" type="checkbox" checked={form.agreeTerms} onChange={handleChange} className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500" required />
                <span>I agree to the Terms of Service & Privacy Policy</span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-6">
              {loading ? 'Creating Account...' : 'Create Account — Free'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
