const logger = require('../logger/index');
module.exports=function (handler){
    return async (req, res, next)=>{
    try {
        await handler(req, res);
    } catch (ex) {
        console.log(ex);
        logger.error(ex.message, ex);
        errorMessage = ex.message ? ex.message : 'Internal Server Error';
        res.status(500).send({status:'500',message:errorMessage});
    }}
};