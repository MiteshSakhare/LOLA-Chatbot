import React, { useState, useEffect } from 'react';
import SendIcon from '@mui/icons-material/Send';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import './QuestionInput.css';

const QuestionInput = ({ question, onSubmit, isLoading }) => {
  const [textValue, setTextValue] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setTextValue('');
    setSelectedOption(null);
    setSelectedOptions([]);
    setValidationError('');
  }, [question?.id]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    setValidationError('');
    let answer;

    if (question.type === 'text') {
      answer = textValue.trim();
      if (!answer && question.required) {
        setValidationError('This field is required');
        return;
      }
      if (question.validation) {
        if (question.validation.min_length && answer.length < question.validation.min_length) {
          setValidationError(`Minimum ${question.validation.min_length} characters required`);
          return;
        }
        if (question.validation.max_length && answer.length > question.validation.max_length) {
          setValidationError(`Maximum ${question.validation.max_length} characters allowed`);
          return;
        }
      }
    } else if (question.type === 'single_choice') {
      answer = selectedOption;
      if (!answer && question.required) {
        setValidationError('Please select an option');
        return;
      }
    } else if (question.type === 'multi_choice') {
      answer = selectedOptions;
      if (answer.length === 0 && question.required) {
        setValidationError('Please select at least one option');
        return;
      }
      if (question.validation) {
        if (question.validation.min_selections && answer.length < question.validation.min_selections) {
          setValidationError(`Please select at least ${question.validation.min_selections} option(s)`);
          return;
        }
        if (question.validation.max_selections && answer.length > question.validation.max_selections) {
          setValidationError(`Please select at most ${question.validation.max_selections} option(s)`);
          return;
        }
      }
    }

    onSubmit(question.id, answer);
  };

  const handleMultiChoiceToggle = (option) => {
    setSelectedOptions(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const isSubmitDisabled = () => {
    if (isLoading) return true;
    if (question.type === 'text') return !textValue.trim();
    if (question.type === 'single_choice') return !selectedOption;
    if (question.type === 'multi_choice') return selectedOptions.length === 0;
    return false;
  };

  if (!question) return null;

  return (
    <div className="question-input">
      <div className="question-input-content">
        {question.type === 'text' && (
          <div className="input-group">
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={question.placeholder || 'Type your answer...'}
              disabled={isLoading}
              rows={4}
              className="text-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey && !isSubmitDisabled()) {
                  handleSubmit();
                }
              }}
            />
          </div>
        )}

        {question.type === 'single_choice' && (
          <div className="options-group">
            {question.options.map((option) => (
              <button
                key={option}
                className={`option-button ${selectedOption === option ? 'selected' : ''}`}
                onClick={() => setSelectedOption(option)}
                disabled={isLoading}
              >
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        )}

        {question.type === 'multi_choice' && (
          <div className="options-group multi">
            {question.options.map((option) => (
              <label key={option} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => handleMultiChoiceToggle(option)}
                  disabled={isLoading}
                  style={{ display: 'none' }}
                />
                <div className="checkbox-custom">
                  {selectedOptions.includes(option) ? (
                    <CheckBoxIcon style={{ fontSize: '24px', color: 'var(--color-primary)' }} />
                  ) : (
                    <CheckBoxOutlineBlankIcon style={{ fontSize: '24px', color: 'var(--color-text-tertiary)' }} />
                  )}
                </div>
                <span className="checkbox-label">{option}</span>
              </label>
            ))}
          </div>
        )}

        {validationError && (
          <div className="validation-error">
            {validationError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled()}
          className="btn btn-primary submit-button"
        >
          <span>{isLoading ? 'Submitting...' : 'Submit'}</span>
          <SendIcon style={{ fontSize: '20px' }} />
        </button>
      </div>
    </div>
  );
};

export default QuestionInput;
