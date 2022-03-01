const Joi = require("@hapi/joi");

const registerValidation = (data) => {
  let schema;
  if (process.env.LOGIN_RECAPTCHA === "true") {
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
      recaptchaToken: Joi.string().required().messages({
        "string.empty": `Recaptcha cannot be an empty field`,
        "any.required": `Recaptcha is a required field`,
      }),
    });
  } else {
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
  }

  return schema.validate(data, { abortEarly: false });
};

const loginValidation = (data) => {
  let schema;
  if (process.env.LOGIN_RECAPTCHA === "true") {
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
      recaptchaToken: Joi.string().required().messages({
        "string.empty": `Recaptcha cannot be an empty field`,
        "any.required": `Recaptcha is a required field`,
      }),
    });
  } else {
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
  }

  return schema.validate(data, { abortEarly: false });
};

const userUpdatePasswordValidation = (data) => {
  const schema = Joi.object({
    // userEmail: Joi.string().email({ minDomainSegments: 2, tlds: {allow: ['com','net']}}).required(),
    userCurrentPassword: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a minimum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    userPassword1: Joi.string().min(8).max(25).required().messages({
      "string.empty": `Password cannot be an empty field`,
      "string.max": `Password should have a minimum length of 25 characters`,
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
      "string.max": `Password should have a minimum length of 25 characters`,
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
      "string.max": `Password should have a minimum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    subUserRole: Joi.string().min(3).max(25).messages({
      "string.empty": `Sub user role cannot be an empty field`,
      "string.max": `Sub user role should have a minimum length of 25 characters`,
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
      "string.max": `Password should have a minimum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    subUserRole: Joi.string().min(3).max(25).messages({
      "string.empty": `Sub user role cannot be an empty field`,
      "string.max": `Sub user role should have a minimum length of 25 characters`,
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
      "string.max": `Password should have a minimum length of 25 characters`,
      "string.min": `Password should have a minimum length of 8 characters`,
      "any.required": `Password is a required field`,
    }),
    subUserRole: Joi.string().max(24).messages({
      "string.empty": `Sub user role cannot be an empty field`,
      "string.max": `Sub user role should have a minimum length of 25 characters`,
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
      "string.max": `Password should have a minimum length of 25 characters`,
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
};
