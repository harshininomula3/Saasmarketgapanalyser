import React from 'react';
import axios from 'axios';
import DomainConfigForm from '../components/DomainConfigForm';

export default function ConfigurePage({
  API_BASE, loading, setLoading, setError, showToast,
  setDomainConfig, setPainPoints, setStage
}) {
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    showToast('Calling Groq AI to generate pain points...', 'loading');
    try {
      const response = await axios.post(`${API_BASE}/agents/pain-points/fetch`, formData);
      if (response.data.stored_count > 0) {
        setDomainConfig(formData);
        const ppRes = await axios.get(`${API_BASE}/api/pain-points?limit=100`);
        setPainPoints(ppRes.data);
        showToast(`✓ Generated ${response.data.stored_count} pain points for "${formData.domain}"`);
        setTimeout(() => setStage('analyze'), 800);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch pain points');
      showToast(err.response?.data?.detail || 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return <DomainConfigForm onSubmit={handleSubmit} loading={loading} />;
}
