import { getAuth } from "@clerk/express";
import BusinessProfile from "../models/businessProfileModel.js";

const API_BASE = 'http://localhost:4000'

// file to url (mapping the files to url)

function uploadedFilesToUrls(req) {
    const urls = {}
    if(!req.files) return urls;

    const logoArr = req.files.logoName || req.files.logo || [];    
    const stampArr = req.files.stampName || req.files.stamp || [];    
    const sigArr = req.files.signatureNameMeta || req.files.signature || [];

    if(logoArr[0]) urls.logoUrl = `${API_BASE}/uploads/${logoArr[0].fileName}`;
    if(stampArr[0]) urls.stampUrl = `${API_BASE}/uploads/${stampArr[0].fileName}`;
    if(sigArr[0]) urls.signatureUrl = `${API_BASE}/uploads/${sigArr[0].fileName}`;

    return urls;

}

// create a business profile

export async function createBusinessProfile(req,res){
    try {
        const {userId} = getAuth(req);

        if(!userId){
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            })
        }

        const body = req.body || {};
        const fileUrls = uploadedFilesToUrls(req);

        const profile = new BusinessProfile({
            owner : userId,
            businessName: body.businessName || "ABC solutions",
            email: body.email || "",
            address: body.address || "",
            phone: body.phone || "",
            gst: body.gst || "",
            logoUrl: fileUrls.logoUrl || body.logoUrl || null,
            stampUrl : fileUrls.stampUrl || body.stampUrl || null,
            signatureUrl : fileUrls.signatureUrl || body. signatureUrl || null,
            signatureOwnerName: body.signatureOwnerName || "",
            signatureOwnerTitle: body.signatureOwnerTitle || "",
            defaultTaxPercent: body.defaultTaxPercent !== undefined ? Number(body.defaultTaxPercent) : 18,
        });

        const saved = await profile.save();
        return res.status(200).json({
            success: true,
            data: saved,
            message: "Business Profile Created"
        })
    } 
    catch (err) {
        console.log("CreateBusiness Profile error", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}


// to update the business profile

export async function updateBusinessProfile(req,res){
    try {
        const {userId} = getAuth(req);

        if(!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const {id} = req.params;
        const body = req.body || {};
        const fileUrls = uploadedFilesToUrls(req);

        const existing = await BusinessProfile.findById(id);

        if(!existing) {
            return res.status(404).json({
                success: false,
                message: "Business profile not found"
            })
        }

        if(existing.owner.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Not your profile"
            })
        }

        const update = {};
        if (body.businessName !== undefined) update.businessName = body.businessName;
        if (body.address !== undefined) update.address = body.address;
        if (body.email !== undefined) update.email = body.email;
        if (body.phone !== undefined) update.phone = body.phone;
        if (body.gst !== undefined) update.gst = body.gst;

        if (fileUrls.logoUrl) update.logoUrl = fileUrls.logoUrl;
        else if (body.logoUrl !== undefined) update.logoUrl = body.logoUrl;

        if (fileUrls.stampUrl) update.stampUrl = fileUrls.stampUrl;
        else if (body.stampUrl !== undefined) update.stampUrl = body.stampUrl;

        if (fileUrls.signatureUrl) update.signatureUrl = fileUrls.signatureUrl;
        else if (body.signatureUrl !== undefined) update.signatureUrl = body.signatureUrl;

        if (body.signatureOwnerName !== undefined) update.signatureOwnerName = body.signatureOwnerName;
        if (body.signatureOwnerTitle !== undefined) update.signatureOwnerTitle = body.signatureOwnerTitle;
        if (body.defaultTaxPercent !== undefined) update.defaultTaxPercent = Number(body.defaultTaxPercent);
        
        const updated = await BusinessProfile.findByIdAndUpdate(id, update, {
            new : true,
            runValidators: true
        })

        return res.status(200).json({
            success: true,
            data: updated,
            message: "Profile updated successfully"
        })
    }
    catch (err) {
        console.log("UpdateBusiness Profile error", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}

// to get mybusiness profile

export async function getMyBusinessProfile(req,res) {
    try {
        const {userId} = getAuth(req);

        if(!userId){
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            })
        }

        const profile = await BusinessProfile.findOne({owner: userId}).lean();

        if(!profile){
            return res.status(204).json({
                success: true,
                message: "No profile found"
            })
        }

        return res.status(200).json({
            success: true,
            data: profile
        });
    } 

    catch (err) {
        console.log("GetMyBusiness Profile error", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}