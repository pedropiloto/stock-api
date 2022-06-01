#!/bin/bash
# Params are in environment variables as PARAM_{SLUG}, e.g. PARAM_USER_ID
curl --location --request POST 'http://api.stock.pedropiloto.com/stock/actions/update' \
--header 'api-key: 9ad7b3ff-d45e-4651-8736-a29f39f9a95c' \
--header 'device-mac-address: airplanedev'