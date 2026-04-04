import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const CUSTOM_SENTINEL = '__custom__';

const ProfessionSelector = ({ value, onChange, required }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await pb.collection('categories').getFullList({ $autoCancel: false });
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // When categories load or value changes from outside, detect if value is custom
  useEffect(() => {
    if (!value || categories.length === 0) return;
    const isKnown = categories.some(c => c.name === value);
    if (!isKnown && value !== CUSTOM_SENTINEL) {
      setCustomMode(true);
      setCustomText(value);
    }
  }, [value, categories]);

  const handleSelectChange = (val) => {
    if (val === CUSTOM_SENTINEL) {
      setCustomMode(true);
      setCustomText('');
      onChange('');
    } else {
      setCustomMode(false);
      setCustomText('');
      onChange(val);
    }
  };

  const handleCustomInput = (e) => {
    const text = e.target.value;
    setCustomText(text);
    onChange(text);
  };

  // Determine what value to show in the Select trigger
  const selectValue = customMode ? CUSTOM_SENTINEL : (value || '');

  return (
    <div className="space-y-2">
      <Select value={selectValue} onValueChange={handleSelectChange} required={required && !customMode}>
        <SelectTrigger className="bg-input border-border text-foreground">
          <SelectValue placeholder={t('professions.select')} />
        </SelectTrigger>
        <SelectContent>
          {categories.map(cat => (
            <SelectItem key={cat.id} value={cat.name}>
              {t(`professions.${cat.name}`, { defaultValue: cat.name })}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_SENTINEL}>
            {t('professions.custom', { defaultValue: 'Other (enter manually)' })}
          </SelectItem>
        </SelectContent>
      </Select>

      {customMode && (
        <Input
          value={customText}
          onChange={handleCustomInput}
          placeholder={t('professions.custom_placeholder', { defaultValue: 'Enter your profession...' })}
          required={required}
          className="bg-input border-border text-foreground"
          autoFocus
        />
      )}
    </div>
  );
};

export default ProfessionSelector;
