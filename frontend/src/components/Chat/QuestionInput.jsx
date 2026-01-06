import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import SendIcon from '@mui/icons-material/Send';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Styles
import './QuestionInput.css';

// ============================================
// CONSTANTS
// ============================================
const INPUT_TYPES = {
  TEXT: 'text',
  SINGLE_CHOICE: 'single_choice',
  MULTI_CHOICE: 'multi_choice',
  MULTI_FIELD: 'multi_field',
  RANKING: 'ranking',
  SCALE: 'scale',
};

const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  SELECT_OPTION: 'Please select an option',
  SELECT_AT_LEAST_ONE: 'Please select at least one option',
  FILL_ALL_FIELDS: 'Please fill in all fields',
  RANK_ALL_ITEMS: 'Please rank all items',
  RATE_ALL_ITEMS: 'Please rate all items',
};

const ANIMATION_VARIANTS = {
  item: {
    initial: { opacity: 0, x: -20 },
    animate: (index) => ({
      opacity: 1,
      x: 0,
      transition: { delay: index * 0.05 },
    }),
  },
};

// ============================================
// SUB-COMPONENTS
// ============================================
const HelpText = ({ text }) => (
  <motion.div
    className="help-text"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
  >
    <InfoOutlinedIcon />
    <span>{text}</span>
  </motion.div>
);

const ValidationError = ({ error }) => (
  <AnimatePresence>
    {error && (
      <motion.div
        className="validation-error"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        {error}
      </motion.div>
    )}
  </AnimatePresence>
);

const TextInput = ({ value, onChange, placeholder, disabled, helpText }) => (
  <motion.div
    className="input-wrapper"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <textarea
      className="text-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={4}
    />
    {helpText && <HelpText text={helpText} />}
  </motion.div>
);

const OptionButton = ({
  option,
  isSelected,
  onClick,
  icon,
  index,
  disabled,
}) => (
  <motion.button
    type="button"
    className={`option-btn ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
    disabled={disabled}
    custom={index}
    initial="initial"
    animate="animate"
    variants={ANIMATION_VARIANTS.item}
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
  >
    {icon}
    <span>{option}</span>
  </motion.button>
);

const FieldInput = ({ field, value, onChange, disabled, index }) => (
  <motion.div
    className="field-group"
    custom={index}
    initial="initial"
    animate="animate"
    variants={ANIMATION_VARIANTS.item}
  >
    <label className="field-label">{field.label}</label>
    <input
      type={field.type || 'text'}
      className="field-input"
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => onChange(field.name, e.target.value)}
      disabled={disabled}
    />
  </motion.div>
);

const RankingItem = ({ item, index, isDragging, provided, disabled }) => (
  <motion.div
    ref={provided.innerRef}
    {...provided.draggableProps}
    {...provided.dragHandleProps}
    className={`ranking-item ${isDragging ? 'dragging' : ''}`}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ delay: index * 0.05 }}
    layout
  >
    <div className="ranking-number">{index + 1}</div>
    <DragIndicatorIcon className="drag-icon" />
    <span className="ranking-text">{item.content}</span>
  </motion.div>
);

const ScaleSlider = ({ field, value, onChange, disabled, index }) => (
  <motion.div
    className="scale-field"
    custom={index}
    initial="initial"
    animate="animate"
    variants={ANIMATION_VARIANTS.item}
  >
    <label className="scale-label">{field.label}</label>
    <div className="scale-input-wrapper">
      <span className="scale-min">{field.min || 1}</span>
      <input
        type="range"
        className="scale-slider"
        min={field.min || 1}
        max={field.max || 10}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
        disabled={disabled}
      />
      <span className="scale-max">{field.max || 10}</span>
      <motion.span
        className="scale-value"
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
      >
        {value}
      </motion.span>
    </div>
  </motion.div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const QuestionInput = ({ question, onSubmit, isLoading }) => {
  // ========== STATE ==========
  const [textValue, setTextValue] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [otherText, setOtherText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [fieldValues, setFieldValues] = useState({});
  const [rankedItems, setRankedItems] = useState([]);
  const [scaleValues, setScaleValues] = useState({});

  // ========== CALLBACKS ==========
  const resetState = useCallback(() => {
    setTextValue('');
    setSelectedOption(null);
    setSelectedOptions([]);
    setOtherText('');
    setFieldValues({});
    setValidationError('');
  }, []);

  const initializeRanking = useCallback(() => {
    if (question?.input_type === INPUT_TYPES.RANKING && question?.options) {
      setRankedItems(
        question.options.map((opt, idx) => ({
          id: `item-${idx}`,
          content: opt,
        }))
      );
    }
  }, [question]);

  const initializeMultiField = useCallback(() => {
    if (question?.input_type === INPUT_TYPES.MULTI_FIELD && question?.fields) {
      const initialFields = {};
      question.fields.forEach((field) => {
        initialFields[field.name] = '';
      });
      setFieldValues(initialFields);
    }
  }, [question]);

  const initializeScale = useCallback(() => {
    if (question?.input_type === INPUT_TYPES.SCALE && question?.fields) {
      const initialScale = {};
      question.fields.forEach((field) => {
        initialScale[field.name] = field.min || 1;
      });
      setScaleValues(initialScale);
    }
  }, [question]);

  const validateAnswer = useCallback((answer) => {
    if (!question.required) return true;

    switch (question.input_type) {
      case INPUT_TYPES.TEXT:
        if (!answer) {
          setValidationError(ERROR_MESSAGES.REQUIRED_FIELD);
          return false;
        }
        break;

      case INPUT_TYPES.SINGLE_CHOICE:
        if (!answer) {
          setValidationError(ERROR_MESSAGES.SELECT_OPTION);
          return false;
        }
        break;

      case INPUT_TYPES.MULTI_CHOICE:
        if (answer.length === 0) {
          setValidationError(ERROR_MESSAGES.SELECT_AT_LEAST_ONE);
          return false;
        }
        break;

      case INPUT_TYPES.MULTI_FIELD:
        const emptyFields = Object.entries(answer).filter(
          ([_, value]) => !value.trim()
        );
        if (emptyFields.length > 0) {
          setValidationError(ERROR_MESSAGES.FILL_ALL_FIELDS);
          return false;
        }
        break;

      case INPUT_TYPES.RANKING:
        if (answer.length === 0) {
          setValidationError(ERROR_MESSAGES.RANK_ALL_ITEMS);
          return false;
        }
        break;

      case INPUT_TYPES.SCALE:
        const missingFields = question.fields.filter(
          (field) => !answer[field.name]
        );
        if (missingFields.length > 0) {
          setValidationError(ERROR_MESSAGES.RATE_ALL_ITEMS);
          return false;
        }
        break;

      default:
        break;
    }

    return true;
  }, [question]);

  const prepareAnswer = useCallback(() => {
    switch (question.input_type) {
      case INPUT_TYPES.TEXT:
        return textValue.trim();

      case INPUT_TYPES.SINGLE_CHOICE:
        return selectedOption;

      case INPUT_TYPES.MULTI_CHOICE:
        let answer = selectedOptions;
        if (selectedOptions.includes('Other') && otherText.trim()) {
          answer = [
            ...selectedOptions.filter((o) => o !== 'Other'),
            `Other: ${otherText.trim()}`,
          ];
        }
        return answer;

      case INPUT_TYPES.MULTI_FIELD:
        return fieldValues;

      case INPUT_TYPES.RANKING:
        return rankedItems.map((item) => item.content);

      case INPUT_TYPES.SCALE:
        return scaleValues;

      default:
        return textValue.trim();
    }
  }, [
    question,
    textValue,
    selectedOption,
    selectedOptions,
    otherText,
    fieldValues,
    rankedItems,
    scaleValues,
  ]);

  const handleSubmit = useCallback(
    (e) => {
      if (e) e.preventDefault();
      setValidationError('');

      const answer = prepareAnswer();

      if (validateAnswer(answer)) {
        onSubmit(question.id, answer);
      }
    },
    [question, prepareAnswer, validateAnswer, onSubmit]
  );

  const handleMultiChoiceToggle = useCallback((option) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  }, []);

  const handleFieldChange = useCallback((fieldName, value) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleScaleChange = useCallback((fieldName, value) => {
    setScaleValues((prev) => ({ ...prev, [fieldName]: parseInt(value) }));
  }, []);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    setRankedItems((items) => {
      const newItems = Array.from(items);
      const [reorderedItem] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, reorderedItem);
      return newItems;
    });
  }, []);

  // ========== COMPUTED VALUES ==========
  const isSubmitDisabled = useMemo(() => {
    if (isLoading) return true;

    if (!question?.required) return false;

    switch (question?.input_type) {
      case INPUT_TYPES.TEXT:
        return !textValue.trim();
      case INPUT_TYPES.SINGLE_CHOICE:
        return !selectedOption;
      case INPUT_TYPES.MULTI_CHOICE:
        return selectedOptions.length === 0;
      case INPUT_TYPES.MULTI_FIELD:
        return Object.values(fieldValues).some((val) => !val.trim());
      case INPUT_TYPES.RANKING:
        return rankedItems.length === 0;
      case INPUT_TYPES.SCALE:
        return question.fields.some((field) => !scaleValues[field.name]);
      default:
        return false;
    }
  }, [
    isLoading,
    question,
    textValue,
    selectedOption,
    selectedOptions,
    fieldValues,
    rankedItems,
    scaleValues,
  ]);

  // ========== EFFECTS ==========
  useEffect(() => {
    resetState();
    initializeRanking();
    initializeMultiField();
    initializeScale();
  }, [question?.id, resetState, initializeRanking, initializeMultiField, initializeScale]);

  // ========== RENDER FUNCTIONS ==========
  const renderInput = () => {
    switch (question?.input_type) {
      case INPUT_TYPES.TEXT:
        return (
          <TextInput
            value={textValue}
            onChange={setTextValue}
            placeholder="Type your answer here..."
            disabled={isLoading}
            helpText={question.help_text}
          />
        );

      case INPUT_TYPES.SINGLE_CHOICE:
        return (
          <div className="options-container">
            {question.options?.map((option, index) => (
              <OptionButton
                key={option}
                option={option}
                isSelected={selectedOption === option}
                onClick={() => setSelectedOption(option)}
                icon={
                  selectedOption === option ? (
                    <RadioButtonCheckedIcon className="icon" />
                  ) : (
                    <RadioButtonUncheckedIcon className="icon" />
                  )
                }
                index={index}
                disabled={isLoading}
              />
            ))}
          </div>
        );

      case INPUT_TYPES.MULTI_CHOICE:
        return (
          <div className="options-container">
            {question.options?.map((option, index) => (
              <OptionButton
                key={option}
                option={option}
                isSelected={selectedOptions.includes(option)}
                onClick={() => handleMultiChoiceToggle(option)}
                icon={
                  selectedOptions.includes(option) ? (
                    <CheckBoxIcon className="icon" />
                  ) : (
                    <CheckBoxOutlineBlankIcon className="icon" />
                  )
                }
                index={index}
                disabled={isLoading}
              />
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

      case INPUT_TYPES.MULTI_FIELD:
        return (
          <motion.div
            className="multi-field-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {question.fields?.map((field, index) => (
              <FieldInput
                key={field.name}
                field={field}
                value={fieldValues[field.name] || ''}
                onChange={handleFieldChange}
                disabled={isLoading}
                index={index}
              />
            ))}
          </motion.div>
        );

      case INPUT_TYPES.RANKING:
        return (
          <div className="ranking-container">
            <motion.p
              className="ranking-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <DragIndicatorIcon /> Drag to reorder (1 = highest priority)
            </motion.p>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="ranking-list">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`ranking-list ${
                      snapshot.isDraggingOver ? 'dragging-over' : ''
                    }`}
                  >
                    <AnimatePresence>
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
                              isDragging={snapshot.isDragging}
                              provided={provided}
                              disabled={isLoading}
                            />
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        );

      case INPUT_TYPES.SCALE:
        return (
          <motion.div
            className="scale-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {question.fields?.map((field, index) => (
              <ScaleSlider
                key={field.name}
                field={field}
                value={scaleValues[field.name] || field.min || 1}
                onChange={handleScaleChange}
                disabled={isLoading}
                index={index}
              />
            ))}
          </motion.div>
        );

      default:
        return null;
    }
  };

  // ========== MAIN RENDER ==========
  return (
    <form onSubmit={handleSubmit} className="question-input-container">
      {renderInput()}

      <ValidationError error={validationError} />

      <motion.button
        type="submit"
        className="submit-btn"
        disabled={isSubmitDisabled}
        whileHover={{ scale: isSubmitDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isSubmitDisabled ? 1 : 0.98 }}
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
