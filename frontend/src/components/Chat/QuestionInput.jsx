import React, { useState, useEffect } from 'react';
import SendIcon from '@mui/icons-material/Send';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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

  const isSubmitDisabled = isLoading || (
    question.type === 'text' ? !textValue.trim() :
    question.type === 'single_choice' ? !selectedOption :
    question.type === 'multi_choice' ? selectedOptions.length === 0 :
    false
  );

  return (
    <div className="input-container">
      {question.type === 'text' && (
        <div className="text-input-wrapper">
          <textarea
            className="text-input-field"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder={question.placeholder || 'e.g., Acme Corp, EST'}
            disabled={isLoading}
            rows={4}
          />
          <div className="input-meta">
            <span className="char-counter">
              {textValue.length}
              {question.validation?.max_length && ` / ${question.validation.max_length}`}
            </span>
          </div>
        </div>
      )}

      {question.type === 'single_choice' && (
        <div className="options-container">
          {question.options.map((option, index) => (
            <button
              key={index}
              type="button"
              className={`option-item ${selectedOption === option ? 'selected' : ''}`}
              onClick={() => setSelectedOption(option)}
              disabled={isLoading}
            >
              <div className="option-indicator">
                {selectedOption === option ? (
                  <RadioButtonCheckedIcon className="radio-icon checked" />
                ) : (
                  <RadioButtonUncheckedIcon className="radio-icon" />
                )}
              </div>
              <span className="option-label">{option}</span>
            </button>
          ))}
        </div>
      )}

      {question.type === 'multi_choice' && (
        <div className="options-container">
          {question.options.map((option, index) => (
            <button
              key={index}
              type="button"
              className={`option-item ${selectedOptions.includes(option) ? 'selected' : ''}`}
              onClick={() => handleMultiChoiceToggle(option)}
              disabled={isLoading}
            >
              <div className="option-indicator">
                {selectedOptions.includes(option) ? (
                  <CheckBoxIcon className="checkbox-icon checked" />
                ) : (
                  <CheckBoxOutlineBlankIcon className="checkbox-icon" />
                )}
              </div>
              <span className="option-label">{option}</span>
              {selectedOptions.includes(option) && (
                <div className="selection-number">
                  {selectedOptions.indexOf(option) + 1}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {validationError && (
        <div className="validation-message">
          <span className="validation-icon">⚠️</span>
          <span className="validation-text">{validationError}</span>
        </div>
      )}

      <div className="submit-section">
        <button
          type="button"
          className="submit-button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          {isLoading ? (
            <>
              <span className="button-spinner"></span>
              Processing...
            </>
          ) : (
            <>
              Submit Answer
              <ArrowForwardIcon className="submit-icon" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuestionInput;
