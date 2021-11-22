require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;

    return await notarize({
        appBundleId: 'net.tetsuakibaba.app.handable',  //★自分のアプリのBundleID(appId)に変更★
        appPath: `${appOutDir}/${appName}.app`,
        appleId: process.env.APPLEID,
        appleIdPassword: process.env.APPLEIDPASS,
        ascProvider: process.env.ASC_PROVIDER
    });
};