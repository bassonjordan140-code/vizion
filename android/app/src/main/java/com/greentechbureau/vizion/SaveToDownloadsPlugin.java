package com.greentechbureau.vizion;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;

/**
 * Enregistre un fichier directement dans le dossier public "Téléchargements"
 * de l'appareil, via la collection MediaStore.Downloads (disponible sans
 * permission de stockage depuis Android 10 / API 29 — le stockage cloisonné
 * l'autorise explicitement pour cette collection précise).
 *
 * Sur Android < 10 (API < 29), MediaStore.Downloads n'existe pas : la méthode
 * rejette l'appel, et le code JS appelant (BackupManager.saveOrShareBlob)
 * se rabat alors sur la feuille de partage native (@capacitor/share), qui
 * fonctionne sur toutes les versions.
 */
@CapacitorPlugin(name = "SaveToDownloads")
public class SaveToDownloadsPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("MediaStore.Downloads nécessite Android 10 (API 29) ou plus récent");
            return;
        }

        String base64Data = call.getString("data");
        String filename = call.getString("filename");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        if (base64Data == null || filename == null) {
            call.reject("Paramètres 'data' et 'filename' requis");
            return;
        }

        byte[] bytes;
        try {
            bytes = Base64.decode(base64Data, Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            call.reject("Données base64 invalides : " + e.getMessage());
            return;
        }

        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
        values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
        values.put(MediaStore.Downloads.IS_PENDING, 1);

        Uri item = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (item == null) {
            call.reject("Impossible de créer l'entrée dans Téléchargements");
            return;
        }

        try (OutputStream out = resolver.openOutputStream(item)) {
            if (out == null) {
                call.reject("Flux d'écriture indisponible");
                return;
            }
            out.write(bytes);
        } catch (Exception e) {
            call.reject("Échec de l'écriture : " + e.getMessage(), e);
            return;
        }

        values.clear();
        values.put(MediaStore.Downloads.IS_PENDING, 0);
        resolver.update(item, values, null, null);

        JSObject ret = new JSObject();
        ret.put("saved", true);
        ret.put("uri", item.toString());
        call.resolve(ret);
    }
}
