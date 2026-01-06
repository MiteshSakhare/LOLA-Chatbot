import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import './QuestionInput.css';

// ============================================
// OPTIMIZED RANKING ITEM (Zero Lag Fix)
// ============================================
const RankingItem = React.memo(({ item, index, provided, snapshot, isDisabled }) => {
  
  // MERGE STYLES: 
  // We strictly control the transition property here. 
  // If dragging, we force transition: 'none' so the element sticks 1:1 to the mouse.
  const style = {
    ...provided.draggableProps.style,
    transition: snapshot.isDragging ? 'none' : provided.draggableProps.style?.transition,
    cursor: isDisabled ? 'not-allowed' : 'grab',
    // Force GPU acceleration to prevent layout shifts
    transform: provided.draggableProps.style?.transform,
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`ranking-item ${snapshot.isDragging ? 'dragging' : ''}`}
      style={style}
    >
      <div className="ranking-number">{index + 1}</div>
      <div className="ranking-content">
        <DragIndicatorIcon className="drag-icon" />
        <span className="ranking-text">{item.content}</span>
      </div>
    </div>
  );
});

RankingItem.displayName = 'RankingItem';

// ============================================
// MAIN COMPONENT
// ============================================
const QuestionInput = ({ question, onSubmit, isLoading }) => {
  const [textValue, setTextValue] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [otherText, setOtherText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [fieldValues, setFieldValues] = useState({});
  const [rankedItems, setRankedItems] = useState([]);
  const [scaleValues, setScaleValues] = useState({});

  useEffect(() => {
    setTextValue('');
    setSelectedOption(null);
    setSelectedOptions([]);
    setOtherText('');
    setFieldValues({});
    setValidationError('');

    if (question?.input_type === 'ranking' && question?.options) {
      setRankedItems(
        question.options.map((opt, idx) => ({
          id: `item-${idx}`,
          content: opt,
        }))
      );
    }

    if (question?.input_type === 'multi_field' && question?.fields) {
      const initialFields = {};
      question.fields.forEach((field) => {
        initialFields[field.name] = '';
      });
      setFieldValues(initialFields);
    }

    if (question?.input_type === 'scale' && question?.fields) {
      const initialScale = {};
      question.fields.forEach((field) => {
        initialScale[field.name] = field.min || 1;
      });
      setScaleValues(initialScale);
    }
  }, [question?.id]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setValidationError('');

    let answer;
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
          answer = [
            ...selectedOptions.filter((o) => o !== 'Other'),
            `Other: ${otherText.trim()}`,
          ];
        }
        if (answer.length === 0 && question.required) {
          setValidationError('Please select at least one option');
          return;
        }
        break;

      case 'multi_field':
        answer = fieldValues;
        if (question.required) {
          const emptyFields = Object.entries(fieldValues).filter(
            ([_, value]) => !value.trim()
          );
          if (emptyFields.length > 0) {
            setValidationError('Please fill in all fields');
            return;
          }
        }
        break;

      case 'ranking':
        answer = rankedItems.map((item) => item.content);
        if (question.required && answer.length === 0) {
          setValidationError('Please rank all items');
          return;
        }
        break;

      case 'scale':
        answer = scaleValues;
        if (question.required) {
          const missingFields = question.fields.filter(
            (field) => !scaleValues[field.name]
          );
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
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const handleFieldChange = (fieldName, value) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleScaleChange = (fieldName, value) => {
    setScaleValues((prev) => ({ ...prev, [fieldName]: parseInt(value) }));
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
        return Object.values(fieldValues).some((val) => !val.trim());
      case 'ranking':
        return rankedItems.length === 0 && question.required;
      case 'scale':
        if (!question.required) return false;
        return question.fields.some((field) => !scaleValues[field.name]);
      default:
        return false;
    }
  };

  const renderInput = () => {
    switch (question?.input_type) {
      case 'text':
        return (
          <motion.div
            className="input-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <textarea
              className="text-input"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Type your answer here..."
              disabled={isLoading}
              rows={4}
            />
            {question.help_text && (
              <div className="help-text">
                <InfoOutlinedIcon />
                <span>{question.help_text}</span>
              </div>
            )}
          </motion.div>
        );

      case 'single_choice':
        return (
          <div className="options-container">
            {question.options?.map((option, index) => (
              <motion.button
                key={option}
                type="button"
                className={`option-btn ${selectedOption === option ? 'selected' : ''}`}
                onClick={() => setSelectedOption(option)}
                disabled={isLoading}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {selectedOption === option ? (
                  <RadioButtonCheckedIcon className="icon" />
                ) : (
                  <RadioButtonUncheckedIcon className="icon" />
                )}
                <span>{option}</span>
              </motion.button>
            ))}
          </div>
        );

      case 'multi_choice':
        return (
          <div className="options-container">
            {question.options?.map((option, index) => (
              <motion.button
                key={option}
                type="button"
                className={`option-btn ${selectedOptions.includes(option) ? 'selected' : ''}`}
                onClick={() => handleMultiChoiceToggle(option)}
                disabled={isLoading}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {selectedOptions.includes(option) ? (
                  <CheckBoxIcon className="icon" />
                ) : (
                  <CheckBoxOutlineBlankIcon className="icon" />
                )}
                <span>{option}</span>
              </motion.button>
            ))}
            {selectedOptions.includes('Other') && question.allow_other && (
              <motion.input
                type="text"
                className="other-input"
                placeholder="Please specify..."
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                disabled={isLoading}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              />
            )}
          </div>
        );

      case 'multi_field':
        return (
          <motion.div
            className="multi-field-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {question.fields?.map((field, index) => (
              <motion.div
                key={field.name}
                className="field-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <label className="field-label">{field.label}</label>
                <input
                  type={field.type || 'text'}
                  className="field-input"
                  placeholder={field.placeholder}
                  value={fieldValues[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  disabled={isLoading}
                />
              </motion.div>
            ))}
          </motion.div>
        );

      case 'ranking':
        return (
          <div className="ranking-container">
            <p className="ranking-hint">
              <DragIndicatorIcon /> Drag to reorder (1 = highest priority)
            </p>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="ranking-list">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`ranking-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {rankedItems.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                        isDragDisabled={isLoading}
                      >
                        {(provided, snapshot) => (
                          <RankingItem
                            item={item}
                            index={index}
                            provided={provided}
                            snapshot={snapshot}
                            isDisabled={isLoading}
                          />
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
          <motion.div
            className="scale-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {question.fields?.map((field, index) => (
              <motion.div
                key={field.name}
                className="scale-field"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <label className="scale-label">{field.label}</label>
                <div className="scale-input-wrapper">
                  <span className="scale-min">{field.min || 1}</span>
                  <input
                    type="range"
                    className="scale-slider"
                    min={field.min || 1}
                    max={field.max || 10}
                    value={scaleValues[field.name] || field.min || 1}
                    onChange={(e) => handleScaleChange(field.name, e.target.value)}
                    disabled={isLoading}
                  />
                  <span className="scale-max">{field.max || 10}</span>
                  <motion.span
                    className="scale-value"
                    key={scaleValues[field.name]}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {scaleValues[field.name] || field.min || 1}
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="question-input-container">
      {renderInput()}

      <AnimatePresence>
        {validationError && (
          <motion.div
            className="validation-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {validationError}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        className="submit-btn"
        disabled={isSubmitDisabled()}
        whileHover={{ scale: isSubmitDisabled() ? 1 : 1.02 }}
        whileTap={{ scale: isSubmitDisabled() ? 1 : 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {isLoading ? (
          <>
            <div className="loading-spinner" />
            Processing...
          </>
        ) : (
          <>
            Submit Answer
            <SendIcon className="icon" />
          </>
        )}
      </motion.button>
    </form>
  );
};

export default QuestionInput;