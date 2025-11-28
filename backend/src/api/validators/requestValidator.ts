import Joi from 'joi';

export const queryRequestSchema = Joi.object({
  question: Joi.string().required().min(1).max(500).messages({
    'string.empty': 'Question cannot be empty',
    'string.min': 'Question must be at least 1 character',
    'string.max': 'Question cannot exceed 500 characters',
    'any.required': 'Question is required',
  }),
  context: Joi.object().optional(),
});

export const validateRequest = (schema: Joi.Schema) => {
  return (data: any) => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      throw new Error(errorMessage);
    }
    
    return value;
  };
};
