import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useVerificationLink } from '@/hooks/useVerificationLink';
import { useAuth } from '@/contexts/AuthContext';
import { getPhonePlaceholder } from '@/utils/phoneUtils';

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyAccountLink, isVerifyingLink } = useVerificationLink();
  const { confirmAccount } = useAuth();
  
  const [token, setToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isVerified, setIsVerified] = useState(false);

  // Extract token and phone from URL parameters
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const phoneParam = searchParams.get('phone');
    
    if (tokenParam) setToken(tokenParam);
    if (phoneParam) setPhoneNumber(phoneParam);
  }, [searchParams]);

  const handleVerifyAccount = async () => {
    if (!token.trim() || !phoneNumber.trim()) {
      setMessage('Please enter both verification token and phone number');
      setMessageType('error');
      return;
    }

    setMessage('');
    const result = await verifyAccountLink({ 
      token: token.trim(), 
      phone_number: phoneNumber.trim() 
    });

    if (result.success) {
      setMessage('Account verified successfully! Redirecting to dashboard...');
      setMessageType('success');
      setIsVerified(true);
      
      // Update user verification status in context
      if (result.user) {
        await confirmAccount(token);
      }
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } else {
      setMessage(result.error || 'Verification failed');
      setMessageType('error');
    }
  };

  const getMessageIcon = () => {
    switch (messageType) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold text-gray-900">
              Mifumo WMS
            </span>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Verify Your Account</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Enter the verification details to complete your account verification
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-semibold text-gray-700">
                Verification Token
              </Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter verification token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+255 700 000 001"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              />
              <p className="text-xs text-blue-600 font-medium mt-1">
                📱 Accepted formats: +255700000001, 0700000001, 255700000001
              </p>
            </div>

            <Button
              onClick={handleVerifyAccount}
              disabled={isVerifyingLink || isVerified || !token.trim() || !phoneNumber.trim()}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isVerifyingLink ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : isVerified ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verified Successfully!
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Account
                </>
              )}
            </Button>

            {message && (
              <Alert className={messageType === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                {getMessageIcon()}
                <AlertDescription className={messageType === 'error' ? 'text-red-800' : 'text-green-800'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                If you don't have a verification token, please contact support or try logging in again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyAccount;
