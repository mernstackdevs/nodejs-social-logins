const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
var jwt = require('jsonwebtoken');
var config = require('../../../config');
const download = require('image-downloader')

dotenv.config();

var User = require('../../models/user');


/*---------------------------------------
        (1)  Social Login 
  ----------------------------------------*/

router.post('/socialLogin', function (req, res) {
    var params = req.body;

    if (!params.social_media_id) {
        res.statusCode = process.env.INV;
        res.json({
            message: 'All fields are mendatory'
        })
    }
    else {
        // save image of user profile if coming from social id
        if (params.profile_image) {
            var imageName = Date.now() + '_profile.png';
            options = {
                url: params.profile_image,
                dest: 'public/images/profile/' + imageName
            }
            download.image(options)
                .then(({ filename }) => {
                    console.log('Saved to', filename)
                    callSocialLogin(imageName);
                })
                .catch((err) => {
                    console.error(err)
                    callSocialLogin('');
                })
        }
        else {
            callSocialLogin('');
        }
        function callSocialLogin(imageName) {
            //This method checks if there is already an entry with same social id
            User.checkEntrySocial(params, function (err, socialUser) {
                if (err) {
                    console.log('Social Login Error', err);
                    res.statusCode = process.env.INV;
                    res.json({
                        message: err
                    });
                }
                else if (socialUser) {

                    // If user account is suspended
                    if (socialUser.status == 'SUS') {
                        res.statusCode = process.env.SUS;
                        res.json({
                            message: process.env.SUSTEXT
                        })
                    }
                    else {
                        //If user is not approved yet.
                        if (socialUser.status == 'PENAPP' && socialUser.profile_step5 == true) {
                            res.statusCode = process.env.INV;
                            res.json({
                                message: "Your approval has been pending by admin."
                            })
                        }
                        // If user profile has been rejected
                        else if (socialUser.status == 'REJ') {
                            res.statusCode = process.env.INV;
                            res.json({
                                message: "Your Request has been rejected by admin."
                            })
                        }
                        else {
                            console.log('user login through social login with existing social media id ');
                            params.profile_image = imageName;
                            User.updateSocialSignup(socialUser._id, params, function (err, updateduser) {
                                if (err) {
                                    res.statusCode = process.env.INV;
                                    res.json({
                                        message: err
                                    })
                                } else {
                                    var token = jwt.sign({ id: updateduser._id }, config.secret, {
                                        expiresIn: 3024000
                                    });
                                    User.getProfile(socialUser._id, function (err, user) {
                                        if (err) {
                                            console.log(" error-- ", err);
                                            res.statusCode = process.env.INV;
                                            res.json({
                                                message: "Something went wrong!",
                                                data: err
                                            })
                                        }
                                        else {
                                            var sendUser = user.toObject();

                                            res.statusCode = process.env.SUC;
                                            res.json({
                                                message: "Login Successfully",
                                                access_token: token,
                                                user_id: String(sendUser._id),
                                                user_type: sendUser.user_type,
                                                profile_count: profile_count,
                                                user: sendUser
                                            })

                                        }
                                    })
                                }
                            })
                        }
                    }


                } else {
                    console.log('new social Entry');
                    User.checkEmailExistSignup(params, function (err, response) {
                        if (err) {
                            console.log('Check email Error', err);
                        }
                        else if (!response || !params.email) {

                            User.addNewUser(params, function (err, user) {
                                if (err) {
                                    console.log('Error', err);
                                }
                                else {
                                    var token = jwt.sign({ id: user._id }, config.secret, {
                                        expiresIn: 3024000
                                    });
                                    var userToSend = user.toObject();

                                    res.statusCode = process.env.SUC;
                                    res.json({
                                        message: "Login Successfully",
                                        access_token: token,
                                        user_id: String(user._id),
                                        user_type: user.user_type,
                                        user: userToSend,
                                        profile_count: 0
                                    })

                                }
                            })

                        }
                        else {
                            console.log('Email already exist in mannaul signup');
                            res.statusCode = process.env.INV;
                            res.json({
                                message: 'Email Already Exist',
                            })
                        }

                    });
                }
            })
        }
    }
});




/*---------------------------------------
          (2)  Get Profile 
 ----------------------------------------*/
router.get('/', verifyUser, function (req, res) {

    User.getProfile(req.userid, function (err, user) {
        if (err) {
            console.log(" error-- ", err);
            res.statusCode = process.env.INV;
            res.json({
                message: "Something went wrong!",
                data: err
            })
        }
        else {
            res.statusCode = process.env.SUC;
            res.json({
                message: "Profile found successfully",
                user: user
            })
        }
    })

});







module.exports = router;