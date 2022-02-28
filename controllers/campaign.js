const database = require("../db/database");
const logger = require("../logger/logger");
const multer = require("multer");
const path = require("path");
const md5 = require("md5");
const { MulterError } = require("multer");

const campaignCollection = database.GetCollection().CampaignCollection();

const createCampaign = (req, res) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
      cb(null, md5(file.originalname) + path.extname(file.originalname));
    },
  });
  const Filter = (req, file, cb) => {
    //   if (file.mimetype.includes("csv", "xlx", "xlsx")) {
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

  //image is the name of the input field.
  const uploadImageInfo = multer({
    storage: storage,
    fileFilter: Filter,
    limits: { fileSize: process.env.MAX_UPLOAD_FILE_SIZE },
  }).single("file"); //"file" is the name of the file input field name

  uploadImageInfo(req, res, function (error) {
    if (error instanceof multer.MulterError) {
      return res.status(500).send(error);
    } else if (error) {
      return res.status(422).send(error);
    }
    if (req.body.smsType === "Instant SMS") {
      console.log(req.body);
      res.send(req.body);
    }
    if (req.body.smsType === "Bulk SMS") {
      console.log(req.file);
      res.send(req.body);
    }
    if (req.body.smsType === "Bulk multi SMS") {
      console.log(req.file);
      res.send(req.body);
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
  // uploadImageInfo,
};
