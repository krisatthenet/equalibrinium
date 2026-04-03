import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PaymentOptionsCard = ({ price, selectedOption, onSelectOption }) => {
  const advanceAmount = price * 0.2;
  const fullDiscountAmount = price * 0.85;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Option 1: 20% Advance */}
      <Card 
        className={`relative overflow-hidden transition-all duration-300 cursor-pointer border-2 rounded-2xl ${
          selectedOption === 'advance_20' 
            ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:shadow-md bg-card'
        }`}
        onClick={() => onSelectOption('advance_20')}
      >
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Pay 20% Advance</h3>
              <p className="text-sm text-muted-foreground mt-1">Balance due upon completion</p>
            </div>
            {selectedOption === 'advance_20' && (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            )}
          </div>
          
          <div className="mt-4 mb-6">
            <span className="text-3xl font-extrabold text-foreground">€{advanceAmount.toFixed(2)}</span>
            <span className="text-muted-foreground ml-2">now</span>
          </div>
          
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
              Secure your booking immediately
            </li>
            <li className="flex items-center text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
              Pay remaining €{(price - advanceAmount).toFixed(2)} later
            </li>
            <li className="flex items-center text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
              Standard cancellation policy applies
            </li>
          </ul>

          <Button 
            variant={selectedOption === 'advance_20' ? 'default' : 'outline'}
            className={`w-full rounded-xl font-semibold ${selectedOption === 'advance_20' ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectOption('advance_20');
            }}
          >
            {selectedOption === 'advance_20' ? 'Selected' : 'Select Option'}
          </Button>
        </CardContent>
      </Card>

      {/* Option 2: Full with 15% Discount */}
      <Card 
        className={`relative overflow-hidden transition-all duration-300 cursor-pointer border-2 rounded-2xl ${
          selectedOption === 'full_discount' 
            ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:shadow-md bg-card'
        }`}
        onClick={() => onSelectOption('full_discount')}
      >
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          15% OFF
        </div>
        
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Pay Full Amount</h3>
              <p className="text-sm text-muted-foreground mt-1">Get an instant 15% discount</p>
            </div>
            {selectedOption === 'full_discount' && (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            )}
          </div>
          
          <div className="mt-4 mb-6 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-foreground">€{fullDiscountAmount.toFixed(2)}</span>
            <span className="text-lg text-muted-foreground line-through mb-1">€{price.toFixed(2)}</span>
          </div>
          
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
              Save €{(price - fullDiscountAmount).toFixed(2)} instantly
            </li>
            <li className="flex items-center text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
              No further payments required
            </li>
            <li className="flex items-center text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
              Priority processing included
            </li>
          </ul>

          <Button 
            variant={selectedOption === 'full_discount' ? 'default' : 'outline'}
            className={`w-full rounded-xl font-semibold ${selectedOption === 'full_discount' ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectOption('full_discount');
            }}
          >
            {selectedOption === 'full_discount' ? 'Selected' : 'Select Option'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentOptionsCard;