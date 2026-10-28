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

import java.io.BufferedOutputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Enregistre un fichier directement dans le dossier public "Téléchargements"
 * de l'appareil, via la collection MediaStore.Downloads (disponible sans
 * permission de stockage depuis Android 10 / API 29 — le stockage cloisonné
 * l'autorise explicitement pour cette collection précise).
 *
 * Sur Android < 10 (API < 29), MediaStore.Downloads n'existe pas : begin()
 * rejette l'appel, et le code JS appelant (BackupManager.writeZipExport)
 * se rabat alors sur la feuille de partage native (@capacitor/share), qui
 * fonctionne sur toutes les versions.
 */
@CapacitorPlugin(name = "SaveToDownloads")
public class SaveToDownloadsPlugin extends Plugin {

    /** Fichier en cours d'écriture par morceaux (begin / append / finish). */
    private static class PendingDownload {
        final Uri uri;
        final OutputStream out;

        PendingDownload(Uri uri, OutputStream out) {
            this.uri = uri;
            this.out = out;
        }
    }

    private final Map<String, PendingDownload> pending = new HashMap<>();

    /**
     * Écriture par morceaux, pour les gros fichiers (sauvegardes avec beaucoup
     * de photos) : passer tout le fichier d'un coup en base64 par le pont JS
     * dépassait la mémoire de la WebView et faisait planter l'app. Le fichier
     * reste invisible (IS_PENDING) jusqu'à finish().
     */
    @PluginMethod
    public void begin(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("MediaStore.Downloads nécessite Android 10 (API 29) ou plus récent");
            return;
        }

        String filename = call.getString("filename");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        if (filename == null) {
            call.reject("Paramètre 'filename' requis");
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

        try {
            OutputStream raw = resolver.openOutputStream(item);
            if (raw == null) {
                resolver.delete(item, null, null);
                call.reject("Flux d'écriture indisponible");
                return;
            }
            String id = UUID.randomUUID().toString();
            synchronized (pending) {
                pending.put(id, new PendingDownload(item, new BufferedOutputStream(raw, 1 << 20)));
            }
            JSObject ret = new JSObject();
            ret.put("id", id);
            call.resolve(ret);
        } catch (Exception e) {
            resolver.delete(item, null, null);
            call.reject("Échec de l'ouverture : " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void append(PluginCall call) {
        String id = call.getString("id");
        String base64Data = call.getString("data");
        PendingDownload download;
        synchronized (pending) {
            download = id == null ? null : pending.get(id);
        }
        if (download == null || base64Data == null) {
            call.reject("Téléchargement inconnu ou données manquantes");
            return;
        }

        try {
            download.out.write(Base64.decode(base64Data, Base64.DEFAULT));
            call.resolve();
        } catch (Exception e) {
            discard(id);
            call.reject("Échec de l'écriture : " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void finish(PluginCall call) {
        String id = call.getString("id");
        PendingDownload download;
        synchronized (pending) {
            download = id == null ? null : pending.remove(id);
        }
        if (download == null) {
            call.reject("Téléchargement inconnu");
            return;
        }

        ContentResolver resolver = getContext().getContentResolver();
        try {
            download.out.close();
        } catch (Exception e) {
            resolver.delete(download.uri, null, null);
            call.reject("Échec de la finalisation : " + e.getMessage(), e);
            return;
        }

        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.IS_PENDING, 0);
        resolver.update(download.uri, values, null, null);

        JSObject ret = new JSObject();
        ret.put("saved", true);
        ret.put("uri", download.uri.toString());
        call.resolve(ret);
    }

    @PluginMethod
    public void abort(PluginCall call) {
        discard(call.getString("id"));
        call.resolve();
    }

    /** Ferme le flux et supprime le fichier incomplet. */
    private void discard(String id) {
        PendingDownload download;
        synchronized (pending) {
            download = id == null ? null : pending.remove(id);
        }
        if (download == null) return;
        try {
            download.out.close();
        } catch (Exception ignored) {
        }
        getContext().getContentResolver().delete(download.uri, null, null);
    }

    @Override
    protected void handleOnDestroy() {
        String[] ids;
        synchronized (pending) {
            ids = pending.keySet().toArray(new String[0]);
        }
        for (String id : ids) discard(id);
        super.handleOnDestroy();
    }
}
