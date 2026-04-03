import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProfessionSelector = ({ value, onChange, required }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);

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

  return (
    <Select value={value} onValueChange={onChange} required={required}>
      <SelectTrigger className="bg-input border-border text-foreground">
        <SelectValue placeholder={t('professions.select')} />
      </SelectTrigger>
      <SelectContent>
        {categories.map(cat => (
          <SelectItem key={cat.id} value={cat.name}>
            {t(`professions.${cat.name}`, { defaultValue: cat.name })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProfessionSelector;