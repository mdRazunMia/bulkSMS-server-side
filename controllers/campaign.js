const database = require("../db/database");
const logger = require("../logger/logger");
const multer = require("multer");
const path = require("path");
const md5 = require("md5");
const { MulterError } = require("multer");
const fs = require("fs");
const csv = require("fast-csv");
const xlsx = require("xlsx");
const aws = require("aws-sdk");
const muterS3 = require("multer-s3");
const xlsx_node_parser = require("node-xlsx");
const { createCampaignValidation } = require("../validations/validation");
const campaignCollection = database.GetCollection().CampaignCollection();

// //Define storage and file name
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "/Users/mdrazunmia/Documents/bulkSMS-server-files");
//   },
//   filename: function (req, file, cb) {
//     uploadFileName = md5(file.originalname) + path.extname(file.originalname);
//     uploadFileExtension = path.extname(file.originalname);
//     cb(null, uploadFileName);
//   },
// });

// //File filter
// const Filter = (req, file, cb) => {
//   if (
//     (file.mimetype == "text/csv" ||
//       file.mimetype ==
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") &&
//     (path.extname(file.originalname) == ".csv" ||
//       path.extname(file.originalname) == ".xlx" ||
//       path.extname(file.originalname) == ".xlsx")
//   ) {
//     cb(null, true);
//   } else {
//     cb("Please upload only csv | xlx | xlsx type file.", false);
//   }
// };

// //Multer upload function
// const uploadImageInfo = multer({
//   storage: storage,
//   fileFilter: Filter,
//   limits: { fileSize: process.env.MAX_UPLOAD_FILE_SIZE },
// }).single("file"); //"file" is the name of the file input field name

// const createCampaign = (req, res) => {
//   // if (!req.file) {
//   //   return res.status(422).send({ errorMessage: "There is no file" });
//   // }
//   // if (
//   //   (file.mimetype !== "text/csv" ||
//   //     file.mimetype !==
//   //       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") &&
//   //   (path.extname(file.originalname) !== ".csv" ||
//   //     path.extname(file.originalname) !== ".xlx" ||
//   //     path.extname(file.originalname) !== ".xlsx")
//   // ) {
//   //   return res
//   //     .status(422)
//   //     .send({ errorMessage: "File formate is not supported." });
//   // } else if (req.file.size > process.env.MAX_UPLOAD_FILE_SIZE) {
//   //   return res
//   //     .status(422)
//   //     .send({ errorMessage: "File size must be less than 10MB." });
//   // }
//   res.send(req.body);
// };

const createCampaign = (req, res) => {
  let uploadFileName;
  let uploadFileExtension;
  let localStorage;
  let uploadImageInfo;

  if (process.env.S3_STORAGE === "true") {
    const S3 = new aws.S3({
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET_KEY,
      region: process.env.AWS_S3_REGION,
    });

    const Filter = (req, file, cb) => {
      if (
        (file.mimetype == "text/csv" ||
          file.mimetype ==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") &&
        (path.extname(file.originalname) == ".csv" ||
          path.extname(file.originalname) == ".xlx" ||
          path.extname(file.originalname) == ".xlsx")
      ) {
        cb(null, true);
      } else {
        cb("Please upload only csv | xlx | xlsx type file.", false);
      }
    };
    //upload image into s3
    uploadImageInfo = multer({
      storage: muterS3({
        s3: S3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: (req, file, cb) => {
          cb(null, { fileName: file.fieldname });
        },
        key: (req, file, cb) => {
          uploadFileName =
            md5(file.originalname) + path.extname(file.originalname);
          uploadFileExtension = path.extname(file.originalname);
          cb(null, uploadFileName);
        },
      }),
      fileFilter: Filter,
    }).single("file");
  }

  if (process.env.LOCAL_STORAGE === "true") {
    //Define storage and file name
    localStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "./uploads/temp");
      },
      filename: function (req, file, cb) {
        uploadFileName =
          md5(file.originalname) + path.extname(file.originalname);
        uploadFileExtension = path.extname(file.originalname);
        cb(null, uploadFileName);
      },
    });

    //File filter
    const Filter = (req, file, cb) => {
      if (
        (file.mimetype == "text/csv" ||
          file.mimetype ==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") &&
        (path.extname(file.originalname) == ".csv" ||
          path.extname(file.originalname) == ".xlx" ||
          path.extname(file.originalname) == ".xlsx")
      ) {
        cb(null, true);
      } else {
        cb("Please upload only csv | xlx | xlsx type file.", false);
      }
    };

    //Multer upload function
    uploadImageInfo = multer({
      storage: localStorage,
      fileFilter: Filter,
      limits: { fileSize: process.env.MAX_UPLOAD_FILE_SIZE },
    }).single("file"); //"file" is the name of the file input field name
  }

  //Read CSV data
  function readCSV() {
    if (process.env.S3_STORAGE === "true") {
      aws.config.update({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY,
      });
      const s3 = new aws.S3();
      let params = {
        Bucket: `${process.env.AWS_BUCKET_NAME}`,
        Key: `${uploadFileName}`,
      };

      // var file = new aws.S3.getObject(params).createReadStream();
      let file = s3.getObject(params).createReadStream();
      const data = csv.parseStream(file);
      data.on("data", (data) => {
        console.log(data);
      });
    }
    if (process.env.LOCAL_STORAGE === "true") {
      let csvData = [];
      let filePath;
      if (process.env.LOCAL_STORAGE === "true")
        filePath = path.resolve("./uploads/campaign_files", uploadFileName);
      if (process.env.S3_STORAGE === "true")
        filePath = path.resolve(
          "https://dotonline-user-profile-image.s3.us-east-2.amazonaws.com/",
          uploadFileName
        );
      fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true })) // { headers: true }
        .on("error", (error) => {
          throw error.message;
        })
        .on("data", (row) => {
          csvData.push(row);
        })
        .on("end", () => {
          // res.send(csvData);
          csvData.map((value, index) => {
            const number = "0" + value.number;
            const message = value.message;
            if (!number || !message) {
              `Serial No.: ${index + 1} | Message or Number is null`;
            } else {
              if (validatePhoneNumber(number)) {
                console.log(
                  `Serial No.: ${
                    index + 1
                  } | Number: ${number} | Message: ${message}`
                );
              } else {
                console.log(
                  `Serial No.: ${index + 1} | Phone number is invalid`
                );
              }
            }
          });
          //other functionalities will be here
        });
    }
  }

  function validatePhoneNumber(phoneNumber) {
    const regex = new RegExp("^(?:\\+88|88)?(01[3-9]\\d{8})$");
    return regex.test(phoneNumber);
  }

  function CharacterCount(message) {
    const character_number = message.length;
    console.log(`character_number: ${character_number}`);
    let sms_count = 0;
    let flag = false;
    for (let i = 1; i <= character_number; i = i + 1) {
      if (i % 120 == 0) {
        flag = false;
        sms_count = sms_count + 1;
      }
      if (i % 120 != 0) {
        flag = true;
      }
    }
    if (flag) {
      sms_count = sms_count + 1;
      console.log("Total SMS: " + sms_count);
    }
    return sms_count;
  }

  //Read XLX / XLSX data
  function readXLSXORXLX() {
    if (process.env.S3_STORAGE === "true") {
      aws.config.update({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY,
      });
      const s3 = new aws.S3();
      let params = {
        Bucket: `${process.env.AWS_BUCKET_NAME}`,
        Key: `${uploadFileName}`,
      };

      // var file = new aws.S3.getObject(params).createReadStream();
      let file = s3.getObject(params).createReadStream();
      let buffers = [];

      file.on("data", function (data) {
        buffers.push(data);
      });
      file.on("end", function () {
        let buffer = Buffer.concat(buffers);
        let workBook = xlsx_node_parser.parse(buffer);
        const data = workBook[0].data;
        const info = {};
        data.map((row, index) => {
          if (index !== 0) {
            row.map((value, index) => {
              console.log(value);
            });
          }
        });
      });
    }
    if (process.env.LOCAL_STORAGE === "true") {
      filePath = path.resolve("./uploads/campaign_files", uploadFileName);

      const workBook = xlsx.readFile(filePath);
      //find sheets
      const workSheet = workBook.Sheets["Sheet2"];
      const clients_messages = xlsx.utils.sheet_to_json(workSheet);
      res.send(clients_messages);
      clients_messages.map((client, index) => {
        const phoneNumber = client["Phone Number"];
        const message = client["Message"];
        if (
          !phoneNumber ||
          phoneNumber === "undefined" ||
          !message ||
          message === "undefined"
        ) {
          console.log(
            `serial No.: ${
              index + 1
            } | The number or the message or both the field is not available.`
          );
        } else {
          if (validatePhoneNumber(phoneNumber)) {
            console.log(
              `serial No.: ${
                index + 1
              } | number: ${phoneNumber} | message: ${message}`
            );
          } else {
            console.log(
              `serial No.: ${index + 1} | phone number is not valid.`
            );
          }
        }
      });
    }
    // res.send(data);
    // for (let i = 0; i < data.length; i++) {
    //   console.log(data[i]);
    // }
  }

  //Read file function
  function readFile() {
    if (uploadFileExtension === ".csv") {
      try {
        readCSV();
      } catch (error) {
        res.send(
          "Unsupported file. Please upload .csv | .xlx | .xlsx type file."
        );
      }
    } else if (
      uploadFileExtension === ".xlx" ||
      uploadFileExtension === ".xlsx"
    ) {
      try {
        console.log("xlx");
        readXLSXORXLX();
      } catch (error) {
        console.log(error);
        res.send(
          "Unsupported file. Please upload .csv | .xlx | .xlsx type file."
        );
      }
    }
  }

  //Move the file from temporary directory to working directory
  function moveFile() {
    const oldFilePath = path.resolve(
      "/Users/mdrazunmia/Documents/bulkSMS-server-side/uploads/temp/" +
        uploadFileName
    );
    const newFilePath = path.resolve(
      "./uploads/campaign_files",
      uploadFileName
    );
    fs.rename(oldFilePath, newFilePath, (error) => {
      if (error) throw error;
      console.log("File successfully moved to the new destination.");
    });
  }

  //Delete file from the temporary directory
  function deleteFile() {
    const oldFilePath = path.resolve(
      "/Users/mdrazunmia/Documents/bulkSMS-server-side/uploads/temp/" +
        uploadFileName
    );
    fs.unlink(oldFilePath, function (err) {
      if (err) {
        throw err;
      } else {
        console.log("Successfully deleted the file.");
      }
    });
  }

  uploadImageInfo(req, res, function (error) {
    if (req.body.smsType === "0") {
      return res.status(422).send({
        errorMessage:
          "You didn't select any SMS type. Please select a SMS type.",
      });
    }
    if (error instanceof multer.MulterError) {
      return res.status(500).send(error);
    } else if (error) {
      return res.status(422).send({ errorMessage: error });
    }
    if (req.body.smsType === "3" || req.body.smsType === "4") {
      if (!req.file)
        return res.status(422).send({
          errorMessage: "File field is empty. Please upload a file.",
        });
    }

    if (req.body.smsType === "2") {
      const requestedObject = {};
      requestedObject.campaignName = req.body.campaignName;
      requestedObject.languageName = req.body.languageName;
      requestedObject.smsType = req.body.smsType;
      requestedObject.instantSMS = req.body.instantSMS;
      requestedObject.phoneNumber = req.body.phoneNumber;

      const { error, value } = createCampaignValidation(requestedObject);
      if (error) {
        const errors = [];
        error.details.forEach((detail) => {
          const currentMessage = detail.message;
          detail.path.forEach((value) => {
            logger.log({
              level: "error",
              message: `${currentMessage} | Code: 1-1`,
            });
            errors.push({ [value]: currentMessage });
          });
        });
        // res.status(422).send({ message: error.details[0].message });
        return res.status(422).send(errors);
      }

      const total_sms_number = CharacterCount(value.instantSMS);
      console.log(total_sms_number);

      if (validatePhoneNumber(value.phoneNumber)) {
        console.log(`${value.phoneNumber} is valid.`);
      } else {
        console.log(`${value.phoneNumber} is not valid.`);
      }
      // console.log(req.body);
      res.send(req.body);
    }

    if (req.body.smsType === "3") {
      const bulkSMSObject = {
        campaignName: req.body.campaignName,
        languageName: req.body.languageName,
        smsType: req.body.smsType,
        bulkSMS: req.body.bulkSMS,
      };
      // console.log(bulkSMSObject);
      const { error, value } = createCampaignValidation(bulkSMSObject);
      if (error) {
        const errors = [];
        error.details.forEach((detail) => {
          const currentMessage = detail.message;
          detail.path.forEach((value) => {
            logger.log({
              level: "error",
              message: `${currentMessage} | Code: 1-1`,
            });
            errors.push({ [value]: currentMessage });
          });
        });
        if (process.env.LOCAL_STORAGE === "true") deleteFile();
        // res.status(422).send({ message: error.details[0].message });
        return res.status(422).send(errors);
      }
      if (process.env.LOCAL_STORAGE === "true") moveFile();
      const total_sms_number = CharacterCount(value.bulkSMS);
      console.log(total_sms_number);
      readFile();
    }

    if (req.body.smsType === "4") {
      const bulkSMSObject = {
        campaignName: req.body.campaignName,
        languageName: req.body.languageName,
        smsType: req.body.smsType,
      };
      const { error, value } = createCampaignValidation(bulkSMSObject);
      if (error) {
        const errors = [];
        error.details.forEach((detail) => {
          const currentMessage = detail.message;
          detail.path.forEach((value) => {
            logger.log({
              level: "error",
              message: `${currentMessage} | Code: 1-1`,
            });
            errors.push({ [value]: currentMessage });
          });
        });
        if (process.env.LOCAL_STORAGE === "true") deleteFile();
        return res.status(422).send(errors);
      }
      if (process.env.LOCAL_STORAGE === "true") moveFile();
      readFile();
      // res.send(req.body);
    }
  });

  //   const campaignInformation = req.body;
  //   console.log(req);
  //   console.log(`file size: ${parseInt(req.headers["content-length"])}`);
  //   console.log(req.file);
  //     let verified = false
  //     campaignCollection.insertOne(campaignInformation, (err, response)=>{
  //         if(err){
  //             logger.log({level: 'error', message: 'Internal error for create campaign in database. | code: 22-2'})
  //             return res.status(500).send({errorMessage: "Something went wrong"})
  //         }
  //         if(response.acknowledged){
  //             verified = true
  //         }
  //     })
  //     logger.log({level: 'info', message: 'Campaign has been created successfully. | code: 22-3'})
  //    res.status(201).send({ message: "Campaign has been created successfully."})
};

//show campaign list
const showAllCampaign = (req, res) => {
  campaignCollection.find({}).toArray((err, result) => {
    if (err) {
      logger.log({
        level: "error",
        message: "Internal error for create campaign in database. | code: 23-1",
      });
      return res
        .status(500)
        .send({ errorMessage: "Something went wrong | code: 23-2" });
    }
    logger.log({
      level: "info",
      message: "Send all the campaign information. | code: 23-3",
    });
    res.status(200).send({
      campaigns: result,
    });
  });
};
//delete a single campaign
const deleteCampaign = (req, res) => {
  const campaignId = req.params.campaignId;
  var deletedCampaignId = { _id: ObjectId(campaignId) };
  campaignCollection.deleteOne(deletedCampaignId, (err, data) => {
    if (err) {
      logger.log({
        level: "error",
        message: "Internal error for create campaign in database. | code: 24-1",
      });
      return res.status(500).send({ errorMessage: "Something went wrong" });
    }
    logger.log({
      level: "info",
      message: "Campaign has been created successfully. | code: 24-2",
    });
    res.status(200).send({
      message: `Campaign id ${campaignId} has been deleted successfully`,
    });
  });
};

//test function
const getData = (req, res) => {
  let value = {
    data: [
      {
        id: "1",
        companyName: "Grameenphone",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },
      {
        id: "2",
        companyName: "Banglalink",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },
      {
        id: "3",
        companyName: "Robi",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },
      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },

      {
        id: "4",
        companyName: "Teletalk",
        currentBalance: "100000000000  SMS",
        details: [
          {
            name: "Md. Maziru rahman shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "Md.",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
          {
            name: "shimul",
            address: "House 55, Road 6, Block C, Niketon, Gulshan, Dhaka",
            contact: "+8801754110088",
          },
        ],
      },
    ],
  };
  // for (let key in value) {
  //   let interData = value[key];
  //   interData.map((data) => {
  //     const details = data.details;
  //     details.map((detail) => {
  //       console.log(detail.name);
  //     });
  //   });
  // }

  res.send(value);
};

module.exports = {
  createCampaign,
  // uploadImageInfo,
  showAllCampaign,
  deleteCampaign,
  getData,
};
