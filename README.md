# Node.js Social Login handlings

This repo contains node js social login handling.
This shows the API where user's who are registering through their social media id are getting saved.

- In this social_media_id is a required parameter.

- It firsts checks if we have any image url from social media if yes then it downloads it and saves as a file in system.

* After it checks if there is already an entry with same social id

* If yes then it checks if user account is suspended/rejected or pending to be verified by admin. if yes then it throws error accordingly.

* If user's account is activated then it updated the user with latest values and creates JWT token and sends as respone.

* If user dont have existing account in system then it creates new user with social media id and saves it to databse.
