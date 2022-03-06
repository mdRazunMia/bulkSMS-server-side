const database = require("../db/database");
const logger = require("../logger/logger");
const multer = require("multer");
const path = require("path");
const md5 = require("md5");
const { MulterError } = require("multer");
const fs = require("fs");
const csv = require("fast-csv");
const xlsx = require("xlsx");
const validatePhoneNumber = require("validate-phone-number-node-js");
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

  //Define storage and file name
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // cb(null, "./uploads/campaign_files");
      cb(
        null,
        "/Users/mdrazunmia/Documents/bulkSMS-server-files/campaign_files/"
      );
    },
    filename: function (req, file, cb) {
      uploadFileName = md5(file.originalname) + path.extname(file.originalname);
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
  const uploadImageInfo = multer({
    storage: storage,
    fileFilter: Filter,
    limits: { fileSize: process.env.MAX_UPLOAD_FILE_SIZE },
  }).single("file"); //"file" is the name of the file input field name

  //Read CSV data
  function readCSV() {
    let csvData = [];
    const filePath = path.resolve("./uploads/campaign_files", uploadFileName);
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
              console.log(`Serial No.: ${index + 1} | Phone number is invalid`);
            }
          }
        });
        //other functionalities will be here
      });
  }

  function validatePhoneNumber(phoneNumber) {
    const regex = new RegExp("^(?:\\+88|88)?(01[3-9]\\d{8})$");
    return regex.test(phoneNumber);
  }

  //Read XLX / XLSX data
  function readXLSXORXLX() {
    const filePath = path.resolve("./uploads/campaign_files/", uploadFileName);
    const workBook = xlsx.readFile(filePath);
    //find sheets
    const workSheet = workBook.Sheets["Sheet2"];
    const clients_messages = xlsx.utils.sheet_to_json(workSheet);
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
          console.log(`serial No.: ${index + 1} | phone number is not valid.`);
        }
      }
    });

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
      "/Users/mdrazunmia/Documents/bulkSMS-server-files/campaign_files/" +
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
      "/Users/mdrazunmia/Documents/bulkSMS-server-files/campaign_files/" +
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
    if (req.body.smsType === "3" || req.body.smsType === "4") {
      if (!req.file)
        return res.status(422).send({
          errorMessage: "File field is empty. Please upload a file.",
        });
    }
    if (req.body.smsType === "0") {
      return res.status(422).send({
        errorMessage:
          "You didn't select any SMS type. Please select a SMS type.",
      });
    }
    if (error instanceof multer.MulterError) {
      return res.status(500).send(error);
    } else if (error) {
      return res.status(422).send(error);
    }

    if (req.body.smsType === "2") {
      const { error, value } = createCampaignValidation(req.body);
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
      console.log(req.body);
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
        deleteFile();
        // res.status(422).send({ message: error.details[0].message });
        return res.status(422).send(errors);
      }
      moveFile();
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
        deleteFile();
        return res.status(422).send(errors);
      }
      moveFile();
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

module.exports = {
  createCampaign,
  // uploadImageInfo,
  showAllCampaign,
  deleteCampaign,
};
