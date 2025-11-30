import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface SMSPackage {
  id: string;
  name: string;
  price: string;
  smsRange: string;
  features: string[];
  isPopular?: boolean;
  isSelected?: boolean;
}

const smsPackages: SMSPackage[] = [
  {
    id: 'lite',
    name: 'Lite',
    price: 'TZS 30/SMS',
    smsRange: '1 to 49,999 SMS',
    features: ['Never expires']
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 'TZS 25/SMS',
    smsRange: '50,000 to 149,999 SMS',
    features: [
      'Priority top-up & support',
      'Advanced delivery analytics',
      'Campaign scheduling'
    ],
    isPopular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'TZS 18/SMS',
    smsRange: '250,000 SMS and above',
    features: [
      'Bulk campaign tools',
      'Advanced analytics',
      'API access'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'TZS 12/SMS',
    smsRange: '1 Million+ SMS',
    features: [
      'Dedicated account manager',
      'Custom invoicing & contracts',
      'Enterprise API & SSO'
    ],
    isSelected: true
  }
];

export const SMSPackageCards: React.FC = () => {
  const handleSelect = (packageId: string) => {
    console.log('Selected package:', packageId);
    // TODO: Implement package selection logic
  };

  return (
    <div className="w-full bg-background p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {smsPackages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`relative bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border ${
              pkg.isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'
            }`}
          >
            {/* Most Popular Badge */}
            {pkg.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full">
                  Most Popular
                </Badge>
              </div>
            )}

            <CardContent className="p-6 text-center h-full flex flex-col">
              {/* Package Name */}
              <h3 className="text-xl font-bold text-foreground mb-3">
                {pkg.name}
              </h3>

              {/* Price */}
              <div className="text-3xl font-bold text-foreground mb-2">
                {pkg.price}
              </div>

              {/* SMS Range */}
              <div className="text-sm text-text-subtle mb-6">
                {pkg.smsRange}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6 flex-1">
                {pkg.features.map((feature, index) => (
                  <div key={index} className="flex items-start text-sm text-foreground">
                    <Check className="w-4 h-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-left">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <Button
                onClick={() => handleSelect(pkg.id)}
                className={`w-full ${
                  pkg.isSelected
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                }`}
                variant={pkg.isSelected ? 'default' : 'outline'}
              >
                {pkg.isSelected ? 'Selected' : 'Select'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SMSPackageCards;
