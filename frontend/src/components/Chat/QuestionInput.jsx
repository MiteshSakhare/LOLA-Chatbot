import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SendIcon from '@mui/icons-material/Send';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import './QuestionInput.css';

const QuestionInput = ({ question, onSubmit, isLoading }) => {
  const [textValue, setTextValue] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [otherText, setOtherText] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // Multi-field state
  const [fieldValues, setFieldValues] = useState({});
  
  // Ranking state
  const [rankedItems, setRankedItems] = useState([]);
  
  // Scale state
  const [scaleValues, setScaleValues] = useState({});

  useEffect(() => {
    setTextValue('');
    setSelectedOption(null);
    setSelectedOptions([]);
    setOtherText('');
    setFieldValues({});
    setValidationError('');
    
    // Initialize ranking items
    if (question?.input_type === 'ranking' && question?.options) {
      setRankedItems(question.options.map((opt, idx) => ({ id: `item-${idx}`, content: opt })));
    }
    
    // Initialize multi-field values
    if (question?.input_type === 'multi_field' && question?.fields) {
      const initialFields = {};
      question.fields.forEach(field => {
        initialFields[field.name] = '';
      });
      setFieldValues(initialFields);
    }
    
    // Initialize scale values
    if (question?.input_type === 'scale' && question?.fields) {
      const initialScale = {};
      question.fields.forEach(field => {
        initialScale[field.name] = field.min || 1;
      });
      setScaleValues(initialScale);
    }
  }, [question?.id]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setValidationError('');

    let answer;

    // Handle different input types
    switch (question.input_type) {
      case 'text':
        answer = textValue.trim();
        if (!answer && question.required) {
          setValidationError('This field is required');
          return;
        }
        break;

      case 'single_choice':
        answer = selectedOption;
        if (!answer && question.required) {
          setValidationError('Please select an option');
          return;
        }
        break;

      case 'multi_choice':
        answer = selectedOptions;
        if (selectedOptions.includes('Other') && otherText.trim()) {
          answer = [...selectedOptions.filter(o => o !== 'Other'), `Other: ${otherText.trim()}`];
        }
        if (answer.length === 0 && question.required) {
          setValidationError('Please select at least one option');
          return;
        }
        break;

      case 'multi_field':
        answer = fieldValues;
        if (question.required) {
          const emptyFields = Object.entries(fieldValues).filter(([_, value]) => !value.trim());
          if (emptyFields.length > 0) {
            setValidationError('Please fill in all fields');
            return;
          }
        }
        break;

      case 'ranking':
        answer = rankedItems.map(item => item.content);
        if (question.required && answer.length === 0) {
          setValidationError('Please rank all items');
          return;
        }
        break;

      case 'scale':
        answer = scaleValues;
        if (question.required) {
          const missingFields = question.fields.filter(field => !scaleValues[field.name]);
          if (missingFields.length > 0) {
            setValidationError('Please rate all items');
            return;
          }
        }
        break;

      default:
        answer = textValue.trim();
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

  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleScaleChange = (fieldName, value) => {
    setScaleValues(prev => ({ ...prev, [fieldName]: parseInt(value) }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(rankedItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRankedItems(items);
  };

  const isSubmitDisabled = () => {
    if (isLoading) return true;

    switch (question?.input_type) {
      case 'text':
        return !textValue.trim() && question.required;
      case 'single_choice':
        return !selectedOption && question.required;
      case 'multi_choice':
        return selectedOptions.length === 0 && question.required;
      case 'multi_field':
        if (!question.required) return false;
        return Object.values(fieldValues).some(val => !val.trim());
      case 'ranking':
        return rankedItems.length === 0 && question.required;
      case 'scale':
        if (!question.required) return false;
        return question.fields.some(field => !scaleValues[field.name]);
      default:
        return false;
    }
  };

  const renderInput = () => {
    switch (question?.input_type) {
      case 'text':
        return (
          <div className="input-wrapper">
            <textarea
              className="text-input"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={question.placeholder || "Type your answer here..."}
              disabled={isLoading}
              rows={3}
            />
            {question.help_text && (
              <div className="help-text">
                <InfoOutlinedIcon fontSize="small" />
                <span>{question.help_text}</span>
              </div>
            )}
          </div>
        );

      case 'single_choice':
        return (
          <div className="options-container">
            {question.options?.map((option, idx) => (
              <button
                key={idx}
                type="button"
                className={`option-btn ${selectedOption === option ? 'selected' : ''}`}
                onClick={() => setSelectedOption(option)}
                disabled={isLoading}
              >
                {selectedOption === option ? (
                  <RadioButtonCheckedIcon className="icon" />
                ) : (
                  <RadioButtonUncheckedIcon className="icon" />
                )}
                <span>{option}</span>
              </button>
            ))}
          </div>
        );

      case 'multi_choice':
        return (
          <div className="options-container">
            {question.options?.map((option, idx) => (
              <div key={idx}>
                <button
                  type="button"
                  className={`option-btn ${selectedOptions.includes(option) ? 'selected' : ''}`}
                  onClick={() => handleMultiChoiceToggle(option)}
                  disabled={isLoading}
                >
                  {selectedOptions.includes(option) ? (
                    <CheckBoxIcon className="icon" />
                  ) : (
                    <CheckBoxOutlineBlankIcon className="icon" />
                  )}
                  <span>{option}</span>
                </button>
                {option === 'Other' && selectedOptions.includes('Other') && (
                  <input
                    type="text"
                    className="other-input"
                    placeholder="Please specify..."
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    disabled={isLoading}
                  />
                )}
              </div>
            ))}
          </div>
        );

      case 'multi_field':
        return (
          <div className="multi-field-container">
            {question.fields?.map((field, idx) => (
              <div key={idx} className="field-group">
                <label className="field-label">{field.label}</label>
                <input
                  type={field.type || 'text'}
                  className="field-input"
                  placeholder={field.placeholder || ''}
                  value={fieldValues[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>
        );

      case 'ranking':
        return (
          <div className="ranking-container">
            <p className="ranking-hint">Drag to reorder (1 = highest priority)</p>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="ranking-list">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`ranking-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {rankedItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`ranking-item ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <div className="ranking-number">{index + 1}</div>
                            <DragIndicatorIcon className="drag-icon" />
                            <span className="ranking-text">{item.content}</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        );

      case 'scale':
        return (
          <div className="scale-container">
            {question.fields?.map((field, idx) => (
              <div key={idx} className="scale-field">
                <label className="scale-label">{field.label}</label>
                <div className="scale-input-wrapper">
                  <span className="scale-min">{field.min || 1}</span>
                  <input
                    type="range"
                    min={field.min || 1}
                    max={field.max || 10}
                    value={scaleValues[field.name] || field.min || 1}
                    onChange={(e) => handleScaleChange(field.name, e.target.value)}
                    className="scale-slider"
                    disabled={isLoading}
                  />
                  <span className="scale-max">{field.max || 10}</span>
                  <span className="scale-value">{scaleValues[field.name] || field.min || 1}</span>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <textarea
            className="text-input"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Type your answer here..."
            disabled={isLoading}
            rows={3}
          />
        );
    }
  };

  return (
    <form className="question-input-container" onSubmit={handleSubmit}>
      {renderInput()}
      
      {validationError && (
        <div className="validation-error">{validationError}</div>
      )}

      <button
        type="submit"
        className="submit-btn"
        disabled={isSubmitDisabled()}
      >
        {isLoading ? (
          <>
            <span className="loading-spinner"></span>
            Processing...
          </>
        ) : (
          <>
            Continue
            <ArrowForwardIcon className="icon" />
          </>
        )}
      </button>
    </form>
  );
};

export default QuestionInput;
