const database = require("../db/database");
const logger = require("../logger/logger");
const multer = require("multer");
const path = require("path");
const md5 = require("md5");
const { MulterError } = require("multer");
const fs = require("fs");
const csv = require("fast-csv");
const xlsx = require("xlsx");
const {
  campaignCreateInstantSMSValidation,
  campaignCreateBulkSMSValidation,
  campaignCreateBulkMultiSMSValidation,
} = require("../validations/validation");
const campaignCollection = database.GetCollection().CampaignCollection();

// Create Campaign
const createCampaign = (req, res) => {
  let uploadFileName;
  let uploadFileExtension;

  //Define storage and file name
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads/campaign_files");
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
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        throw error.message;
      })
      .on("data", (row) => {
        csvData.push(row);
      })
      .on("end", () => {
        res.send(csvData);
        //other functionalities will be here
      });
  }

  //Read XLX / XLSX data
  function readXLSXORXLX() {
    const filePath = path.resolve("./uploads/campaign_files/", uploadFileName);
    const workBook = xlsx.readFile(filePath);
    //find sheets
    const workSheet = workBook.Sheets["Sheet2"];
    const data = xlsx.utils.sheet_to_json(workSheet);
    console.log(data);
    res.send(data);
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
        res.send(
          "Unsupported file. Please upload .csv | .xlx | .xlsx type file."
        );
      }
    }
  }

  uploadImageInfo(req, res, function (error) {
    if (
      req.body.smsType === "Bulk SMS" ||
      req.body.smsType === "Bulk multi SMS"
    ) {
      if (!req.file)
        return res.status(422).send({
          errorMessage: "File field is empty. Please upload a file.",
        });
    }

    if (error instanceof multer.MulterError) {
      return res.status(500).send(error);
    } else if (error) {
      return res.status(422).send(error);
    }

    if (req.body.smsType === "Instant SMS") {
      const { error, value } = campaignCreateInstantSMSValidation(req.body);
      if (error) {
        const errors = [];
        error.details.forEach((detail) => {
          const currentMessage = detail.message;
          detail.path.forEach((value) => {
            // logger.log({
            //   level: "error",
            //   message: `${currentMessage} | Code: 1-1`,
            // });
            errors.push({ [value]: currentMessage });
          });
        });
        // res.status(422).send({ message: error.details[0].message });
        return res.status(422).send(errors);
      }
      console.log(req.body);
      res.send(req.body);
    }

    if (req.body.smsType === "Bulk SMS") {
      const { error, value } = campaignCreateBulkSMSValidation(req.body);
      if (error) {
        const errors = [];
        error.details.forEach((detail) => {
          const currentMessage = detail.message;
          detail.path.forEach((value) => {
            // logger.log({
            //   level: "error",
            //   message: `${currentMessage} | Code: 1-1`,
            // });
            errors.push({ [value]: currentMessage });
          });
        });
        // res.status(422).send({ message: error.details[0].message });
        return res.status(422).send(errors);
      }
      readFile();
    }

    if (req.body.smsType === "Bulk multi SMS") {
      const { error, value } = campaignCreateBulkMultiSMSValidation(req.body);
      if (error) {
        const errors = [];
        error.details.forEach((detail) => {
          const currentMessage = detail.message;
          detail.path.forEach((value) => {
            // logger.log({
            //   level: "error",
            //   message: `${currentMessage} | Code: 1-1`,
            // });
            errors.push({ [value]: currentMessage });
          });
        });
        // res.status(422).send({ message: error.details[0].message });
        return res.status(422).send(errors);
      }
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
  showAllCampaign,
  deleteCampaign,
};
