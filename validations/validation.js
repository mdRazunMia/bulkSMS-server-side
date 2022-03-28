const Joi = require("@hapi/joi");

const registerValidation = (data) => {
  let schema;
  schema = Joi.object({
    userFullName: Joi.string().min(3).max(255).required().messages({
      "string.empty": `User name cannot be an empty field`,
      "string.max": `User name should have a maximum length of 255 characters`,
      "string.min": `User name should have a minimum length of 3 characters`,
      "any.required": `User name is a required field`,
    }),
    userEmail: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required()
      .messages({
        "string.empty": `Email cannot be empty`,
        "string.email": `Email must be a valid Email.`,
        "any.required": `Email is required`,
      }),
    userPassword1: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a maximum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    userPassword2: Joi.any()
      .equal(Joi.ref("userPassword1"))
      .required()
      .messages({ "any.only": "Confirm password does not match" }),
  });

  if (process.env.REGISTRATION_RECAPTCHA === "true") {
    schema = schema.append({
      recaptchaToken: Joi.string().required().messages({
        "string.empty": `Recaptcha cannot be an empty field`,
        "any.required": `Recaptcha is a required field`,
      }),
    });
    //return registrationRecaptchaSchema.validate(data, { abortEarly: false });
  }
  return schema.validate(data, { abortEarly: false });
};

const loginValidation = (data) => {
  let schema;
  schema = Joi.object({
    userEmail: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required()
      .messages({
        "string.empty": `Email cannot be empty`,
        "string.email": `Email must be a valid Email.`,
        "any.required": `Email is required`,
      }),
    userPassword: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a maximum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
  });

  if (process.env.LOGIN_RECAPTCHA === "true") {
    const loginRecaptchaSchema = schema.append({
      recaptchaToken: Joi.string().required().messages({
        "string.empty": `Recaptcha cannot be an empty field`,
        "any.required": `Recaptcha is a required field`,
      }),
    });
    return loginRecaptchaSchema.validate(data, { abortEarly: false });
  }
  return schema.validate(data, { abortEarly: false });
};

const userUpdatePasswordValidation = (data) => {
  const schema = Joi.object({
    // userEmail: Joi.string().email({ minDomainSegments: 2, tlds: {allow: ['com','net']}}).required(),
    userCurrentPassword: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a maximum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    userPassword1: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a maximum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    userPassword2: Joi.any()
      .equal(Joi.ref("userPassword1"))
      .required()
      .messages({ "any.only": "Confirm password does not match" }),
  });
  return schema.validate(data, { abortEarly: false });
};

const userForgetPasswordValidation = (data) => {
  const schema = Joi.object({
    userPassword1: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a maximum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    userPassword2: Joi.any()
      .equal(Joi.ref("userPassword1"))
      .required()
      .messages({ "any.only": "Confirm password does not match" }),
  });
  return schema.validate(data, { abortEarly: false });
};

const updateUserInformationValidation = (data) => {
  const schema = Joi.object({
    userFullName: Joi.string().min(3).max(255).required().messages({
      "string.empty": `User name cannot be an empty field`,
      "string.max": `User name should have a maximum length of 255 characters`,
      "string.min": `User name should have a minimum length of 3 characters`,
      "any.required": `User name is a required field`,
    }),
    userEmail: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required()
      .messages({
        "string.empty": `Email cannot be empty`,
        "string.email": `Email must be a valid Email.`,
        "any.required": `Email is required`,
      }),
    userPassword: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a maximum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
  });
  return schema.validate(data, { abortEarly: false });
};

const subUserCreateValidation = (data) => {
  const schema = Joi.object({
    subUserName: Joi.string().min(3).max(25).required().messages({
      "string.empty": `Sub user name cannot be an empty field`,
      "string.max": `Sub user name should have a maximum length of 255 characters`,
      "string.min": `Sub user name should have a minimum length of 3 characters`,
      "any.required": `Sub user name is a required field`,
    }),
    subUserPassword: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a maximum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    subUserRole: Joi.string().min(3).max(25).messages({
      "string.empty": `Sub user role cannot be an empty field`,
      "string.max": `Sub user role should have a maximum length of 25 characters`,
      "string.min": `Sub user role should have a minimum length of 3 characters`,
      "any.required": `Sub user role is a required field`,
    }),
  });
  return schema.validate(data, { abortEarly: false });
};

const subUserLoginValidation = (data) => {
  const schema = Joi.object({
    subUserName: Joi.string().min(3).max(25).required().messages({
      "string.empty": `Sub user name cannot be an empty field`,
      "string.max": `Sub user name should have a maximum length of 25 characters`,
      "string.min": `Sub user name should have a minimum length of 3 characters`,
      "any.required": `Sub user name is a required field`,
    }),
    subUserPassword: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a maximum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    subUserRole: Joi.string().min(3).max(25).messages({
      "string.empty": `Sub user role cannot be an empty field`,
      "string.max": `Sub user role should have a maximum length of 25 characters`,
      "string.min": `Sub user role should have a minimum length of 3 characters`,
      "any.required": `Sub user role is a required field`,
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

const subUserEditValidation = (data) => {
  const schema = Joi.object({
    subUserName: Joi.string().max(24).required().messages({
      "string.empty": `Sub user name cannot be an empty field`,
      "string.max": `Sub user name should have a maximum length of 25 characters`,
      "string.min": `Sub user name should have a minimum length of 3 characters`,
      "any.required": `Sub user name is a required field`,
    }),
    subUserPassword: Joi.string().min(8).max(24).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a maximum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    subUserRole: Joi.string().max(24).messages({
      "string.empty": `Sub user role cannot be an empty field`,
      "string.max": `Sub user role should have a maximum length of 25 characters`,
      "string.min": `Sub user role should have a minimum length of 3 characters`,
      "any.required": `Sub user role is a required field`,
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

const subUserPasswordResetValidation = (data) => {
  const schema = Joi.object({
    subUserPassword1: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a maximum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    subUserPassword2: Joi.any()
      .equal(Joi.ref("subUserPassword1"))
      .required()
      .messages({ "any.only": "Confirm password does not match" }),
  });
  return schema.validate(data, { abortEarly: false });
};

const createCampaignValidation = (data) => {
  //console.log(typeof data.smsType);
  let schema = Joi.object({
    campaignName: Joi.string().min(6).max(255).required().messages({
      "string.empty": `Campaign name cannot be an empty field`,
      "string.max": `Campaign name should have a maximum length of 255 characters`,
      "string.min": `Campaign name should have a minimum length of 6 characters`,
      "any.required": `Campaign name is a required field`,
    }),
    languageName: Joi.string().required().messages({
      "string.empty": `Language name cannot be an empty field`,
      "any.required": `Language is a required field`,
    }),
  });
  //2-->instance 3-->bulk 4-->bulk multi
  if (data.smsType === "2") {
    schema = schema.append({
      smsType: Joi.required().messages({
        "any.required": `SMS is a required filed`,
      }),
      instantSMS: Joi.string().required().messages({
        "string.empty": `Instant SMS cannot be an empty field`,
        "any.required": `Instant SMS is a required field`,
      }),
      phoneNumber: Joi.string().required().messages({
        "string.empty": `Phone number cannot be an empty field`,
        "any.required": `Phone number is a required field`,
      }),
    });
    // return instanceSchema.validate(data, { abortEarly: false });
  } else if (data.smsType === "3") {
    schema = schema.append({
      smsType: Joi.required().messages({
        "any.required": `SMS is a required filed`,
      }),
      bulkSMS: Joi.string().required().messages({
        "string.empty": `Bulk SMS cannot be an empty field`,
        "any.required": `Bulk SMS is a required field`,
      }),
    });
    //return bulKSchema.validate(data, { abortEarly: false });
  } else if (data.smsType === "4") {
    schema = schema.append({
      smsType: Joi.required().messages({
        "any.required": `SMS is a required filed`,
      }),
    });
    // return bulkMultiSchema.validate(data, { abortEarly: false });
  }
  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  registerValidation,
  loginValidation,
  userUpdatePasswordValidation,
  subUserCreateValidation,
  subUserLoginValidation,
  subUserEditValidation,
  subUserPasswordResetValidation,
  userForgetPasswordValidation,
  updateUserInformationValidation,
  createCampaignValidation,
};
